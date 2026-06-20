/**
 * Deep scraper for SakuraFlow /basics — all 141 lessons.
 * Navigates every slide, extracts kana/vocab data + downloads all images.
 *
 * Requirements:
 *   npm install playwright (already installed if scrape-busuu was used)
 *   .env.sakuraflow at project root with SAKURA_EMAIL and SAKURA_PASSWORD
 *
 * Usage:
 *   node scripts/scrape-sakuraflow.js
 *
 * Output:
 *   sakuraflow_raw.json        → full scraped data (lessons + slides)
 *   public/kana-mnemonics/     → all images downloaded (merges with existing)
 *
 * Then run:
 *   node scripts/convert-sakuraflow.js
 * to generate src/lib/basics-lessons.ts
 */

const { chromium } = require("playwright");
const fs   = require("fs");
const path = require("path");
const https = require("https");
const http  = require("http");

// ── Credentials ───────────────────────────────────────────────────────────────
const envPath = path.join(__dirname, "../.env.sakuraflow");
if (!fs.existsSync(envPath)) {
  console.error("❌  .env.sakuraflow manquant.\nCrée le fichier avec :\nSAKURA_EMAIL=ton@email.com\nSAKURA_PASSWORD=motdepasse");
  process.exit(1);
}
const env = Object.fromEntries(
  fs.readFileSync(envPath, "utf8")
    .split("\n").filter(l => l.includes("="))
    .map(l => { const i = l.indexOf("="); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);
const { SAKURA_EMAIL, SAKURA_PASSWORD } = env;
if (!SAKURA_EMAIL || !SAKURA_PASSWORD) {
  console.error("❌  SAKURA_EMAIL ou SAKURA_PASSWORD manquant dans .env.sakuraflow");
  process.exit(1);
}

// ── Config ────────────────────────────────────────────────────────────────────
const TOTAL_LESSONS  = 141;
const IMGS_DIR       = path.join(__dirname, "../public/kana-mnemonics");
const OUT_JSON       = path.join(__dirname, "../sakuraflow_raw.json");
const MAX_SLIDES     = 60; // safety cap per lesson

if (!fs.existsSync(IMGS_DIR)) fs.mkdirSync(IMGS_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Download helper ───────────────────────────────────────────────────────────
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) { resolve(null); return; }
    if (fs.existsSync(dest)) { resolve(dest); return; } // skip if cached
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(dest);
    const req = proto.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); fs.unlink(dest, () => {});
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(dest); });
    });
    req.on("error", err => { fs.unlink(dest, () => {}); reject(err); });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function extFromUrl(url) {
  try { const p = new URL(url).pathname; return p.split(".").pop()?.split("?")[0]?.toLowerCase() || "webp"; }
  catch { return "webp"; }
}

// ── Slug a string for filename ────────────────────────────────────────────────
function slug(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 50);
}

// ── Extract all data from one slide page ──────────────────────────────────────
async function extractSlide(page, lessonN, slideN) {
  return page.evaluate(({ lessonN, slideN }) => {
    const body  = document.body;
    const text  = body.innerText || "";

    // ── Slide type detection ──
    // SakuraFlow uses clear labels: "HIRAGANA", "KATAKANA", "WORDS", "STROKE ORDER", etc.
    const badge = (text.match(/^(HIRAGANA|KATAKANA|WORDS|REVIEW|VOCABULARY|STROKE ORDER|MEMORY HOOK|PRONUNCIATION|PRACTICE)/mi) || [])[1]?.toUpperCase() || null;

    // ── Progress counter e.g. "3 / 12" ──
    const progressM = text.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
    const progress = progressM ? { cur: +progressM[1], total: +progressM[2] } : null;

    // ── Kana character (single hiragana/katakana) ──
    let kanaChar = null;
    // Check large elements first
    const candidates = Array.from(body.querySelectorAll("h1,h2,h3,[class*='char'],[class*='kana'],[class*='character'],[class*='letter'],[class*='glyph']"));
    for (const el of candidates) {
      const t = el.innerText?.trim();
      if (t && /^[ぁ-ゖァ-ヶ]$/.test(t)) { kanaChar = t; break; }
    }
    // Fallback: scan all elements by font-size
    if (!kanaChar) {
      for (const el of Array.from(body.querySelectorAll("*"))) {
        if (el.children.length > 0) continue;
        const t = el.innerText?.trim();
        if (!t || !/^[ぁ-ゖァ-ヶ]$/.test(t)) continue;
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs >= 32) { kanaChar = t; break; }
      }
    }

    // ── Romaji (e.g. "a", "shi", "tsu") ──
    let romaji = null;
    for (const el of Array.from(body.querySelectorAll("[class*='romaji'],[class*='roman'],[class*='latin'],[class*='sound'],[class*='phonetic']"))) {
      const t = el.innerText?.trim();
      if (t && /^[a-z]{1,5}$/.test(t)) { romaji = t; break; }
    }
    if (!romaji && kanaChar) {
      // extract from description line
      const m = text.match(/(?:stands for|sound|pronunc[^.]*)[^a-z]*([a-z]{1,5})(?:\s|$|\.)/i);
      if (m) romaji = m[1];
    }

    // ── Mnemonic / "Memory Hook" text ──
    let mnemonic = null;
    // Pattern 1: "X is hiding inside an apple…" style
    const mnemonicPat = /([ぁ-ゖァ-ヶ][^.!?]{10,180}(?:looks like|sounds like|resembles|hiding|shaped like|represents|letter|stands for)[^.!?]{0,120}[.!?])/i;
    const mnemonicM = text.match(mnemonicPat);
    if (mnemonicM) mnemonic = mnemonicM[1].trim();

    // Pattern 2: Memory Hook card block
    if (!mnemonic) {
      const hookEl = Array.from(body.querySelectorAll("*")).find(el =>
        el.childElementCount === 0 && /memory hook/i.test(el.innerText)
      );
      if (hookEl) {
        const card = hookEl.closest("[class*='card'],[class*='section'],[class*='panel'],div");
        if (card) {
          const t = card.innerText.replace(/memory hook/i, "").trim();
          if (t.length > 10) mnemonic = t;
        }
      }
    }

    // Pattern 3: any sentence containing the kana
    if (!mnemonic && kanaChar) {
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.includes(kanaChar) && l.length > 20 && l.length < 300);
      if (lines[0]) mnemonic = lines[0];
    }

    // ── "Looks like..." description (separate from mnemonic on SakuraFlow) ──
    let looksLike = null;
    const looksM = text.match(/(?:looks like|reminds me of|imagine)[^\n]{10,200}/i);
    if (looksM) looksLike = looksM[0].trim();

    // ── Description line "This hiragana character stands for the sound X." ──
    const descM = text.match(/This (hiragana|katakana) character stands for the sound ([a-z]{1,5})\./i);
    const description = descM ? descM[0] : null;
    if (descM && !romaji) romaji = descM[2];

    // ── Vocabulary word ──
    let vocabWord = null;
    let vocabMeaning = null;

    // Look for a Japanese word (multi-char) prominently displayed
    const bigWords = Array.from(body.querySelectorAll("h1,h2,h3,[class*='word'],[class*='vocab'],[class*='term']"));
    for (const el of bigWords) {
      const t = el.innerText?.trim();
      if (t && /[ぁ-ゖァ-ヶ]/.test(t) && t.length >= 2 && t.length <= 10 && !/\n/.test(t)) {
        vocabWord = t; break;
      }
    }

    // English meaning
    if (vocabWord || badge === "WORDS") {
      const englishLines = text.split("\n").map(l => l.trim()).filter(l =>
        l.length > 1 && l.length < 60 &&
        /^[A-Z][a-z]/.test(l) &&
        !/HIRAGANA|KATAKANA|WORDS|MEMORY|STROKE|PRACTICE|REVIEW|NEXT|BACK|CHECK|CONTINUE|FINISH|START/i.test(l)
      );
      if (englishLines[0]) vocabMeaning = englishLines[0];
    }

    // ── Quiz / Exercise detection ──
    const choiceEls = Array.from(body.querySelectorAll("[class*='choice'],[class*='option'],[class*='answer'],[class*='quiz'],[class*='pick']"));
    const choices = choiceEls
      .map(el => ({ text: el.innerText?.trim(), correct: el.className?.includes("correct") || el.getAttribute("data-correct") === "true" }))
      .filter(c => c.text && c.text.length > 0 && c.text.length < 80);

    // ── Buttons ──
    const buttons = Array.from(body.querySelectorAll("button"))
      .map(b => b.innerText?.trim())
      .filter(t => t && t.length > 0 && t.length < 60);

    // ── Images ──
    const imgs = Array.from(document.querySelectorAll("img")).map(img => ({
      src: img.currentSrc || img.src || "",
      alt: img.alt || "",
      w: img.naturalWidth || img.width || 0,
      h: img.naturalHeight || img.height || 0,
      cls: img.className || "",
    })).filter(i => i.src && !i.src.startsWith("data:") && !i.src.startsWith("blob:") && i.w > 40);

    // ── Lesson title / subtitle from lesson intro page ──
    const h1 = document.querySelector("h1")?.innerText?.trim() || null;
    const h2 = document.querySelector("h2")?.innerText?.trim() || null;

    // Detect if lesson is locked (redirect check)
    const isLocked = /locked|premium|upgrade|subscribe/i.test(text.substring(0, 500));

    return {
      lessonN, slideN,
      badge, progress,
      kanaChar, romaji, description,
      mnemonic, looksLike,
      vocabWord, vocabMeaning,
      choices, buttons, imgs,
      h1, h2,
      isLocked,
      rawText: text.substring(0, 2000),
    };
  }, { lessonN, slideN });
}

// ── Scrape one lesson by clicking through all slides ──────────────────────────
async function scrapeLesson(page, n) {
  const url = `https://www.sakuraflow.app/basics/lesson/${n}`;
  process.stdout.write(`  L${String(n).padStart(3,"0")} `);

  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
  }
  await sleep(1500);

  // Check redirect (locked)
  const landed = page.url();
  if (!landed.includes(`/lesson/${n}`) && !landed.includes("/basics")) {
    console.log(`⛔ locked (→ ${landed})`);
    return null;
  }

  // Grab lesson intro metadata before entering
  const introData = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      h1: document.querySelector("h1")?.innerText?.trim() || null,
      h2: document.querySelector("h2")?.innerText?.trim() || null,
      allText: text.substring(0, 1500),
    };
  });

  // Click "Let's go" / "Start" to enter lesson
  for (const pattern of [/let'?s go/i, /start lesson/i, /begin/i, /start/i]) {
    const btn = page.locator("button").filter({ hasText: pattern }).first();
    if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await btn.click();
      await sleep(1800);
      break;
    }
  }
  // Try Enter key as fallback
  await page.keyboard.press("Enter").catch(() => {});
  await sleep(800);

  const slides = [];
  let slideN = 0;
  let sameProgressCount = 0;
  let lastProgress = null;
  let doneBtns = 0;

  while (slideN < MAX_SLIDES) {
    slideN++;
    await sleep(900);

    const data = await extractSlide(page, n, slideN);

    // Download images
    const localImgs = [];
    for (const img of data.imgs) {
      try {
        const ext = extFromUrl(img.src);
        // Build a meaningful filename
        let fname;
        if (data.kanaChar && img.cls?.includes("memory") || img.cls?.includes("hook") || img.cls?.includes("mnemonic") || img.alt) {
          fname = `L${n}_S${slideN}_${slug(img.alt || "img")}.${ext}`;
        } else {
          fname = `L${n}_S${slideN}_${slug(img.cls || "img")}_${localImgs.length}.${ext}`;
        }
        const dest = path.join(IMGS_DIR, fname);
        await downloadFile(img.src, dest).catch(() => {});
        localImgs.push({ ...img, local: `/kana-mnemonics/${fname}` });
      } catch {
        localImgs.push(img);
      }
    }
    data.imgs = localImgs;

    slides.push(data);

    // Log
    const kk = data.kanaChar || (data.vocabWord ? `「${data.vocabWord}」` : "?");
    const rr = data.romaji || "-";
    const prog = data.progress ? `${data.progress.cur}/${data.progress.total}` : "-";
    process.stdout.write(`[${kk}/${rr} p${prog}] `);

    // Stop detection
    if (data.progress) {
      if (lastProgress && data.progress.cur === lastProgress.cur && data.progress.total === lastProgress.total) {
        sameProgressCount++;
        if (sameProgressCount >= 3) { process.stdout.write("✅ DONE\n"); break; }
      } else {
        sameProgressCount = 0;
        lastProgress = data.progress;
      }
    }

    // Navigate: try buttons in priority order
    let advanced = false;

    // 1. "Next" button
    for (const pat of [/^next$/i, /^continue$/i, /^finish$/i, /^done$/i, /^got it$/i]) {
      const btn = page.locator("button").filter({ hasText: pat }).first();
      if (await btn.isVisible({ timeout: 600 }).catch(() => false)) {
        await btn.click();
        await sleep(500);
        advanced = true;
        break;
      }
    }

    if (!advanced) {
      // 2. "Check" button (exercise — disabled until answer selected)
      const checkBtn = page.locator("button").filter({ hasText: /^check$/i }).first();
      if (await checkBtn.isVisible({ timeout: 600 }).catch(() => false)) {
        // Click first available (non-disabled) answer choice
        const choiceSels = ["[class*='choice']", "[class*='option']", "[class*='answer']", "label", "li[role='option']"];
        for (const sel of choiceSels) {
          const els = await page.locator(sel).all();
          for (const el of els) {
            const disabled = await el.isDisabled().catch(() => false);
            const visible  = await el.isVisible().catch(() => false);
            if (visible && !disabled) {
              await el.click({ timeout: 2000 }).catch(() => {});
              await sleep(500);
              break;
            }
          }
          // If check button is now enabled, stop looking
          const stillDisabled = await checkBtn.isDisabled().catch(() => true);
          if (!stillDisabled) break;
        }
        // Click Check with force to avoid infinite wait on disabled state
        await checkBtn.click({ timeout: 5000, force: true }).catch(() => {});
        await sleep(800);
        advanced = true;
      }
    }

    if (!advanced) {
      // 3. Keyboard shortcut (arrow right / enter)
      await page.keyboard.press("ArrowRight").catch(() => {});
      await sleep(600);
      // Check if page actually moved
      const newData = await page.evaluate(() => document.body.innerText.substring(0, 200));
      if (newData !== data.rawText?.substring(0, 200)) {
        advanced = true;
      }
    }

    if (!advanced) {
      doneBtns++;
      if (doneBtns >= 2) { process.stdout.write("✅ END\n"); break; }
    } else {
      doneBtns = 0;
    }
  }

  if (slideN >= MAX_SLIDES) process.stdout.write("⚠️ MAX\n");

  return { n, url, intro: introData, slides };
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("🚀  SakuraFlow scraper — 141 leçons\n");

  // Resume from partial run if file exists
  let existing = { lessons: [] };
  if (fs.existsSync(OUT_JSON)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
      console.log(`📂  Reprise : ${existing.lessons.length} leçons déjà scrappées`);
    } catch {}
  }
  const doneSet = new Set(existing.lessons.map(l => l.n));

  const browser = await chromium.launch({ headless: false, slowMo: 30 });
  const context = await browser.newContext({
    locale: "en-US",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    // ── Login ────────────────────────────────────────────────────────────────
    console.log("🔐  Login SakuraFlow...");
    await page.goto("https://www.sakuraflow.app/login", { waitUntil: "networkidle", timeout: 30000 });
    await sleep(1000);

    // Fill email + password
    await page.fill("input[type='email'], input[name='email']", SAKURA_EMAIL);
    await sleep(300);
    await page.fill("input[type='password'], input[name='password']", SAKURA_PASSWORD);
    await sleep(300);

    // Submit
    await page.click("button[type='submit']").catch(() =>
      page.press("input[type='password']", "Enter")
    );
    await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
    await sleep(2500);

    const landedUrl = page.url();
    console.log(`✅  URL après login : ${landedUrl}`);
    if (landedUrl.includes("/login")) {
      console.error("❌  Toujours sur /login — vérifier les credentials");
      await browser.close();
      process.exit(1);
    }

    // ── Scrape lessons ────────────────────────────────────────────────────────
    console.log(`\n📚  Scrape ${TOTAL_LESSONS} leçons...\n`);
    const lessons = [...existing.lessons];
    let fails = 0;

    for (let n = 1; n <= TOTAL_LESSONS; n++) {
      if (doneSet.has(n)) {
        console.log(`  L${String(n).padStart(3,"0")} ⏭  déjà scrappée`);
        continue;
      }

      const result = await scrapeLesson(page, n);

      if (!result) {
        fails++;
        if (fails >= 5) {
          console.log(`\n⛔  5 échecs consécutifs — arrêt`);
          break;
        }
        await sleep(1000);
        continue;
      }

      fails = 0;
      lessons.push(result);
      doneSet.add(n);

      // Save incrementally after every lesson
      fs.writeFileSync(OUT_JSON, JSON.stringify({ scrapedAt: new Date().toISOString(), lessons }, null, 2));
    }

    console.log(`\n✅  Scrape terminé : ${lessons.length} leçons`);
    console.log(`📄  Données : ${OUT_JSON}`);
    console.log(`🖼  Images  : ${IMGS_DIR}`);
    console.log(`\nÉtape suivante :`);
    console.log(`  node scripts/convert-sakuraflow.js`);

  } finally {
    await sleep(2000);
    await browser.close();
  }
})();
