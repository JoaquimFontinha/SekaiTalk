/**
 * Scrape Busuu Japanese A1/A2/B1 content using Playwright.
 * Usage: node scripts/scrape-busuu.js
 * Credentials: .env.busuu at project root (BUSUU_EMAIL, BUSUU_PASSWORD)
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

// ── Load credentials ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.busuu");
if (!fs.existsSync(envPath)) {
  console.error("❌  Fichier .env.busuu manquant. Crée-le avec :\nBUSUU_EMAIL=...\nBUSUU_PASSWORD=...");
  process.exit(1);
}
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .filter(l => l.includes("="))
    .map(l => l.split("=").map(s => s.trim()))
);
const { BUSUU_EMAIL, BUSUU_PASSWORD } = env;
if (!BUSUU_EMAIL || !BUSUU_PASSWORD) {
  console.error("❌  BUSUU_EMAIL ou BUSUU_PASSWORD manquant dans .env.busuu");
  process.exit(1);
}

// ── Levels to scrape ──────────────────────────────────────────────────────────
const LEVELS = [
  { slug: "a1", label: "A1 (N5)", url: "https://www.busuu.com/dashboard/timeline/a1" },
  { slug: "a2", label: "A2 (N4)", url: "https://www.busuu.com/dashboard/timeline/a2" },
  { slug: "b1", label: "B1 (N3)", url: "https://www.busuu.com/dashboard/timeline/b1" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function scrollToBottom(page) {
  let prev = 0;
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await sleep(600);
    const cur = await page.evaluate(() => document.body.scrollHeight);
    if (cur === prev) break;
    prev = cur;
  }
}

// ── Scrape a single level page ────────────────────────────────────────────────
async function scrapeLevelPage(page, levelUrl) {
  await page.goto(levelUrl, { waitUntil: "networkidle", timeout: 30000 });
  await sleep(2000);

  // Scroll to load lazy content
  await scrollToBottom(page);
  await sleep(1000);

  return await page.evaluate(() => {
    const result = {
      units: [],
      rawText: document.body.innerText.substring(0, 50000),
    };

    // Try to find unit/lesson cards — Busuu uses various class patterns
    const selectors = [
      "[class*='unit']",
      "[class*='lesson']",
      "[class*='timeline']",
      "[class*='course']",
      "[class*='level']",
      "[class*='topic']",
      "[data-unit]",
      "[data-lesson]",
    ];

    const found = new Set();
    for (const sel of selectors) {
      try {
        document.querySelectorAll(sel).forEach(el => {
          const text = el.innerText?.trim();
          if (text && text.length > 5 && text.length < 500 && !found.has(text)) {
            found.add(text);
            result.units.push({
              selector: sel,
              text,
              tag: el.tagName,
              classes: el.className,
            });
          }
        });
      } catch {}
    }

    // Also grab all headings
    result.headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).map(h => ({
      tag: h.tagName,
      text: h.innerText?.trim(),
    })).filter(h => h.text);

    // Grab list items that look like lesson names
    result.listItems = Array.from(document.querySelectorAll("li,span,p"))
      .map(el => el.innerText?.trim())
      .filter(t => t && t.length > 3 && t.length < 200)
      .slice(0, 300);

    return result;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("🚀  Lancement du navigateur...");
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const context = await browser.newContext({
    locale: "fr-FR",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    // ── Login ────────────────────────────────────────────────────────────────
    console.log("🔐  Connexion à Busuu...");
    await page.goto("https://www.busuu.com/fr/login", { waitUntil: "networkidle", timeout: 30000 });
    await sleep(2000);

    // Screenshot for debug
    await page.screenshot({ path: path.join(__dirname, "../busuu_login.png") });
    console.log("   📸  Screenshot login sauvegardé : busuu_login.png");

    // Accept cookies — try multiple approaches
    for (const sel of ["#onetrust-accept-btn-handler", "button:has-text('Accepter tout')", "button:has-text('Accept all')", "button:has-text('Tout accepter')", ".save-preference-btn-handler"]) {
      try { await page.click(sel, { timeout: 3000 }); await sleep(600); break; } catch {}
    }

    // Dump all inputs for debug
    const inputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("input")).map(i => ({
        type: i.type, name: i.name, placeholder: i.placeholder, id: i.id, className: i.className
      }))
    );
    console.log("   📋  Inputs trouvés sur la page :", JSON.stringify(inputs));

    // Use exact IDs discovered from page dump
    await page.fill("#login-form-email", BUSUU_EMAIL);
    console.log("   ✅  Email rempli");
    await sleep(300);
    await page.fill("#login-form-password", BUSUU_PASSWORD);
    console.log("   ✅  Password rempli");
    await sleep(300);

    await page.screenshot({ path: path.join(__dirname, "../busuu_prefill.png") });

    // Submit — find the login button
    const buttons = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button,input[type='submit']")).map(b => ({
        type: b.type, text: b.innerText?.trim(), id: b.id, className: b.className, name: b.name
      }))
    );
    console.log("   📋  Boutons trouvés :", JSON.stringify(buttons.slice(0, 10)));

    // Click the exact submit button
    await page.click("#login-form-submit", { timeout: 5000 }).catch(async () => {
      await page.press("#login-form-password", "Enter");
    });

    // ⚠️ CAPTCHA possible — attendre confirmation manuelle
    console.log("\n\n========================================");
    console.log("⚠️  CAPTCHA détecté dans le navigateur.");
    console.log("👉  1. Regarde la fenêtre Chromium ouverte");
    console.log("👉  2. Résous le CAPTCHA");
    console.log("👉  3. Clique sur S'identifier");
    console.log("👉  4. Une fois sur le dashboard, reviens ici");
    console.log("👉  5. Appuie sur ENTRÉE pour continuer");
    console.log("========================================\n");

    // Wait for user to press Enter
    await new Promise(resolve => {
      process.stdin.setRawMode(false);
      process.stdin.resume();
      process.stdin.once("data", () => { process.stdin.pause(); resolve(); });
    });
    await sleep(1000);

    const currentUrl = page.url();
    console.log("   🌐  URL après login :", currentUrl);
    if (currentUrl.includes("/login")) {
      await page.screenshot({ path: path.join(__dirname, "../busuu_login_failed.png") });
      console.error("❌  Toujours sur la page login après 3 min. Screenshot : busuu_login_failed.png");
      await browser.close();
      process.exit(1);
    }
    console.log("✅  Connecté ! URL actuelle :", currentUrl);

    // ── Navigate to Japanese course ──────────────────────────────────────────
    // Find Japanese language or navigate directly
    try {
      await page.goto("https://www.busuu.com/dashboard", { waitUntil: "networkidle", timeout: 20000 });
      await sleep(2000);
      // Try clicking Japanese if language selection appears
      const jpBtn = page.locator("text=Japonais, text=Japanese, img[alt*='Japanese'], img[alt*='Japonais']");
      if (await jpBtn.count() > 0) {
        await jpBtn.first().click();
        await sleep(2000);
      }
    } catch {}

    // ── Scrape each level ────────────────────────────────────────────────────
    const allData = {};

    for (const level of LEVELS) {
      console.log(`\n📚  Scrape niveau ${level.label}...`);
      try {
        const data = await scrapeLevelPage(page, level.url);
        allData[level.slug] = { label: level.label, ...data };
        console.log(`   ✅  ${data.headings?.length || 0} titres, ${data.units?.length || 0} unités trouvées`);
        await sleep(1500);
      } catch (err) {
        console.warn(`   ⚠️  Erreur sur ${level.label}:`, err.message);
        allData[level.slug] = { label: level.label, error: err.message };
      }
    }

    // ── Save results ─────────────────────────────────────────────────────────
    const outPath = path.join(__dirname, "../busuu_content.json");
    fs.writeFileSync(outPath, JSON.stringify(allData, null, 2), "utf8");
    console.log(`\n✅  Contenu sauvegardé dans busuu_content.json`);

    // Also save a readable text version
    let txt = "=== CONTENU BUSUU JAPONAIS ===\n\n";
    for (const [slug, data] of Object.entries(allData)) {
      txt += `\n${'='.repeat(60)}\n${data.label}\n${'='.repeat(60)}\n\n`;
      if (data.headings?.length) {
        txt += "-- TITRES --\n";
        data.headings.forEach(h => { txt += `[${h.tag}] ${h.text}\n`; });
        txt += "\n";
      }
      if (data.rawText) {
        txt += "-- TEXTE BRUT (premiers 8000 caractères) --\n";
        txt += data.rawText.substring(0, 8000) + "\n\n";
      }
    }
    const txtPath = path.join(__dirname, "../busuu_content.txt");
    fs.writeFileSync(txtPath, txt, "utf8");
    console.log(`✅  Version texte sauvegardée dans busuu_content.txt`);

  } finally {
    await sleep(2000);
    await browser.close();
  }
})();
