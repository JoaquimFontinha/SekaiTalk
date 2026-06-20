/**
 * Recover the FULL SakuraFlow course (lost project) into a readable doc.
 *   node scripts/recover-sakuraflow-course.js  →  sakuraflow_course_recovery.md
 *
 * Method (gap-filled):
 *   - The "Overview" TOC (sakuraflow_content.json .meta) is in true course order;
 *     its array position == the REAL lesson number (verified: 32/32 title matches,
 *     0 conflicts vs the per-lesson scrape). It carries 70 titles + the numbered
 *     CHAPTER dividers (positions 17 = CHAPTER 2, 118 = CHAPTER 8).
 *   - The per-lesson scrape (sakuraflow_raw.json) carries 62 lessons with full
 *     content (kana/vocab), keyed by the REAL lesson number from each intro.
 *   - Merging both by real number → 100/141 titled. The remaining 41 are
 *     review/quiz checkpoints (no new vocabulary).
 *   - Chapters: 2 boundaries are scraped (Ch.2 @ 17 = 20 lessons, Ch.8 @ 118 =
 *     8 lessons). The others are reconstructed from the mega-quiz checkpoints
 *     that close each kana block — clearly flagged as estimated.
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const cm  = JSON.parse(fs.readFileSync(path.join(ROOT, "sakuraflow_content.json"), "utf8")).meta;
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, "sakuraflow_raw.json"), "utf8"));

// ── Per-lesson scrape, keyed by REAL lesson number (from the intro) ──────────
function parseIntro(at) {
  if (!at) return null;
  const m = at.match(/LESSON (\d+)\n([\s\S]*?)\n\n📖/);
  if (!m) return null;
  const learn = at.match(/WHAT YOU'LL LEARN\n([\s\S]*?)\nLet's go!/);
  const dm = at.match(/📖\n(\d+)\nNEW/), em = at.match(/✏️\n(\d+)\nEXERCISES/), xm = at.match(/⭐\n\+?(\d+)\nXP/);
  return {
    real: +m[1],
    title: m[2].split("\n").map((s) => s.trim()).filter(Boolean).join(" — "),
    learn: learn ? learn[1].split("\n").map((s) => s.trim()).filter(Boolean) : [],
    nw: dm && +dm[1], ex: em && +em[1], xp: xm && +xm[1],
  };
}
const content = new Map();
for (const l of raw.lessons) {
  const p = parseIntro(l.intro && l.intro.allText);
  if (p && !content.has(p.real)) content.set(p.real, p);
}

// ── Which review/quiz checkpoints still had exercise slides captured ─────────
const reviewHasSlides = new Set();
for (const l of raw.lessons) {
  for (const s of l.slides) {
    const m = (s.rawText || "").match(/\nLESSON (\d+)\n/);
    if (m) reviewHasSlides.add(+m[1]);
  }
}

// ── Les 10 chapitres (numéro réel de leçon → début de chapitre) ──────────────
// Noms, sous-titres et nombres de leçons CONFIRMÉS par l'utilisateur (cartes du
// cours). Les comptes (17+20+14+28+26+10+3+8+8+7) = 141 → frontières exactes.
const CHAPTERS = [
  { num: 1,  start: 1,   note: "Hiragana Start — Premiers pas avec les hiragana · 17 leçons", scraped: true },
  { num: 2,  start: 18,  note: "Everyday Hiragana — Plus de caractères et phrases du quotidien · 20 leçons", scraped: true },
  { num: 3,  start: 38,  note: "Complete Hiragana — Les rangées restantes : ま, や, ら, わ · 14 leçons", scraped: true },
  { num: 4,  start: 52,  note: "Katakana Start — À la découverte des caractères anguleux · 28 leçons", scraped: true },
  { num: 5,  start: 80,  note: "Katakana Master — Maîtrise tous les katakana · 26 leçons", scraped: true },
  { num: 6,  start: 106, note: "Special Characters — Maîtrise っ, les yōon et voyelles longues · 10 leçons", scraped: true },
  { num: 7,  start: 116, note: "Numbers & First Kanji — ichi–juu et 一–十 · 3 leçons", scraped: true },
  { num: 8,  start: 119, note: "Counters & Counting — ひとつ, 〜にん, 〜さい, 〜じ · 8 leçons", scraped: true },
  { num: 9,  start: 127, note: "Demonstratives & Questions — これ・それ・あれ, mots interrogatifs et langues · 8 leçons", scraped: true },
  { num: 10, start: 135, note: "Everyday & Phrases — Phrases pratiques pour la vie au Japon · 7 leçons", scraped: true },
];
function chapterAt(real) {
  let c = CHAPTERS[0];
  for (const ch of CHAPTERS) if (real >= ch.start) c = ch;
  return c;
}

// ── Build the definitive 1..141 list ─────────────────────────────────────────
const MAXLESSON = 141;
function rowFor(real) {
  const c = content.get(real);
  const ovEntry = cm[real - 1];
  const ovTitle = ovEntry && ovEntry.title && !/CHAPTER/i.test(ovEntry.title) ? ovEntry.title : null;
  if (c) return { real, kind: "content", title: c.title, learn: c.learn, nw: c.nw, ex: c.ex, xp: c.xp };
  if (ovTitle) return { real, kind: "title", title: ovTitle + (ovEntry.description ? " — " + ovEntry.description : "") };
  if (reviewHasSlides.has(real)) return { real, kind: "quiz", title: "Quiz / révision (exercices uniquement)" };
  return { real, kind: "empty", title: "(session non capturée — probablement une révision)" };
}

const L = [];
L.push("# Récupération complète du cours SakuraFlow (JLPT N5)");
L.push("");
L.push("> Reconstruit depuis le scrape de ton ancien projet. **Couverture : 100/141 titres**, dont **62 leçons** avec le contenu pédagogique complet (kana/vocabulaire). Les 41 restantes sont des **sessions de révision/quiz** (sans nouveau vocabulaire).");
L.push("> Les **10 chapitres** (noms, sous-titres et nombre de leçons) sont confirmés par l'utilisateur. Les comptes font 141 → frontières exactes.");
L.push("");
L.push("Légende : **gras** = contenu complet · texte normal = titre seul · _italique_ = révision/quiz/non capturé.");
L.push("");

let curChapter = null;
for (let real = 1; real <= MAXLESSON; real++) {
  const ch = chapterAt(real);
  if (!curChapter || ch.num !== curChapter.num) {
    curChapter = ch;
    L.push("");
    L.push("## 📕 Chapitre " + ch.num + (ch.scraped ? "" : " _(est.)_") + " — à partir de la leçon " + ch.start);
    L.push("_" + ch.note + "_");
    L.push("");
  }
  const r = rowFor(real);
  const tag = "**L" + real + ".** ";
  if (r.kind === "content") {
    L.push("- " + tag + "**" + r.title + "**  `" + (r.nw || 0) + " nouv. · " + (r.ex || 0) + " ex. · +" + (r.xp || 0) + " XP`");
    if (r.learn.length) L.push("  - " + r.learn.join("、 "));
  } else if (r.kind === "title") {
    L.push("- " + tag + r.title);
  } else {
    L.push("- " + tag + "_" + r.title + "_");
  }
}

fs.writeFileSync(path.join(ROOT, "sakuraflow_course_recovery.md"), L.join("\n"), "utf8");

// stats
let kinds = { content: 0, title: 0, quiz: 0, empty: 0 };
for (let real = 1; real <= MAXLESSON; real++) kinds[rowFor(real).kind]++;
console.log("✅  sakuraflow_course_recovery.md écrit (" + MAXLESSON + " leçons, " + CHAPTERS.length + " chapitres)");
console.log("   Contenu complet : " + kinds.content + " | titre seul : " + kinds.title + " | quiz : " + kinds.quiz + " | non capturé : " + kinds.empty);
console.log("   Titrées (contenu+titre) : " + (kinds.content + kinds.title) + "/141");
