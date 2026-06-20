/**
 * Convert sakuraflow_raw.json → src/lib/basics-lessons.ts
 *
 * Usage (after running scrape-sakuraflow.js):
 *   node scripts/convert-sakuraflow.js
 *
 * What it does:
 *   1. Reads sakuraflow_raw.json (141 lessons) — the source of truth.
 *   2. Parses each slide's `rawText` (the rendered slide text) rather than the
 *      buggy pre-parsed DOM fields. Format confirmed below.
 *   3. Recovers the FIRST item of each lesson — it is missing from `slides`
 *      because the scraper skipped slide 1 (Enter-key bug). The full ordered
 *      list lives in `intro.allText` under "WHAT YOU'LL LEARN … Let's go!".
 *      Where possible the first item is enriched (mnemonic + image) from
 *      sakuraflow_deep.json, which DID capture slide 1 for the first lessons.
 *   4. Renames the downloaded images to clean names derived from their source
 *      URL (hiragana-a-apple.webp → a-apple.webp, word-illustrations/…/ao.webp
 *      → word-ao.webp) inside public/kana-mnemonics/.
 *   5. Translates English meanings to French.
 *   6. Skips quiz/review lessons (no kana/vocab slides).
 *   7. Generates ALL_LESSONS + generateExercises in src/lib/basics-lessons.ts.
 *
 * rawText format (confirmed):
 *   Kana  : "…\nLESSON N\nHIRAGANA\nい\nStroke order\nR\ni\n\nThis hiragana
 *            character stands for the sound i. …\n≈\nMEMORY HOOK\nLooks like…\n\n
 *            <mnemonic>\n\nBack\nNext\n\n2 / 5\n…"
 *            (the line after the char can be "Stroke order" OR "Writing…";
 *             dakuten katakana may have NO "MEMORY HOOK" block)
 *   Vocab : "…\nLESSON N\nNEW WORD\nあお\nR\nao\n\nBlue\n\nBack\nNext\n\n2 / 3\n…"
 */

const fs   = require("fs");
const path = require("path");

const RAW_JSON  = path.join(__dirname, "../sakuraflow_raw.json");
const DEEP_JSON = path.join(__dirname, "../sakuraflow_deep.json");
const OUT_TS    = path.join(__dirname, "../src/lib/basics-lessons.ts");
const IMGS_DIR  = path.join(__dirname, "../public/kana-mnemonics");

if (!fs.existsSync(RAW_JSON)) {
  console.error("❌  sakuraflow_raw.json introuvable. Lance d'abord : node scripts/scrape-sakuraflow.js");
  process.exit(1);
}

const raw  = JSON.parse(fs.readFileSync(RAW_JSON, "utf8"));
const deep = fs.existsSync(DEEP_JSON) ? JSON.parse(fs.readFileSync(DEEP_JSON, "utf8")) : { lessons: [] };
console.log(`📂  ${raw.lessons.length} leçons chargées depuis sakuraflow_raw.json`);
console.log(`📂  ${deep.lessons.length} leçons complètes depuis sakuraflow_deep.json (enrichissement 1er item)`);

// ── French translation lookup ─────────────────────────────────────────────────
const FR_DICT = {
  // Common N5/N4 vocab
  "Love": "Amour", "Blue": "Bleu", "Above": "Au-dessus", "Below": "En dessous",
  "Face": "Visage", "Station": "Gare", "To go": "Aller", "Pond": "Étang", "Voice": "Voix",
  "Sushi": "Sushi", "Morning": "Matin", "Here": "Ici", "Cherry blossom": "Fleur de cerisier",
  "Umbrella": "Parapluie", "Chair": "Chaise", "Foot": "Pied", "Leg": "Jambe",
  "Foot / Leg": "Pied / Jambe", "World": "Monde", "Lie": "Mensonge",
  // Body
  "Head": "Tête", "Eye": "Œil / Yeux", "Ear": "Oreille", "Nose": "Nez", "Mouth": "Bouche",
  "Hand": "Main", "Arm": "Bras", "Shoulder": "Épaule", "Back": "Dos", "Stomach": "Ventre",
  "Leg / Foot": "Jambe / Pied", "Tooth / Teeth": "Dent / Dents", "Hair": "Cheveux",
  "Finger": "Doigt", "Knee": "Genou", "Neck": "Cou",
  // Family
  "Mother": "Mère", "Father": "Père", "Sister": "Sœur", "Brother": "Frère",
  "Friend": "Ami(e)", "Person": "Personne", "Woman": "Femme", "Man": "Homme",
  "Child": "Enfant", "Teacher": "Professeur", "Student": "Étudiant(e)",
  "Doctor": "Médecin", "Parents": "Parents",
  // Nature
  "Mountain": "Montagne", "River": "Rivière", "Sea / Ocean": "Mer / Océan", "Sea": "Mer",
  "Ocean": "Océan", "Sky": "Ciel", "Star": "Étoile", "Moon": "Lune", "Sun": "Soleil",
  "Rain": "Pluie", "Snow": "Neige", "Wind": "Vent", "Flower": "Fleur", "Tree": "Arbre",
  "Forest": "Forêt", "Island": "Île", "Beach": "Plage", "Lake": "Lac", "Cloud": "Nuage",
  // Food
  "Rice": "Riz", "Water": "Eau", "Tea": "Thé", "Bread": "Pain", "Meat": "Viande",
  "Fish": "Poisson", "Egg": "Œuf", "Milk": "Lait", "Coffee": "Café", "Juice": "Jus",
  "Beer": "Bière", "Ramen": "Ramen", "Tempura": "Tempura", "Sake": "Saké",
  "Onigiri": "Onigiri", "Bento": "Bento", "Miso": "Miso", "Tofu": "Tofu",
  "Gyoza": "Gyōza", "Yakitori": "Yakitori", "Udon": "Udon", "Soba": "Soba",
  "Katsu": "Katsu", "Teriyaki": "Teriyaki", "Sukiyaki": "Sukiyaki",
  // Colors
  "Red": "Rouge", "White": "Blanc", "Black": "Noir", "Yellow": "Jaune",
  "Green": "Vert", "Orange": "Orange", "Purple": "Violet", "Pink": "Rose",
  "Brown": "Marron", "Grey": "Gris", "Gray": "Gris",
  // Numbers / Time
  "One": "Un", "Two": "Deux", "Three": "Trois", "Four": "Quatre", "Five": "Cinq",
  "Six": "Six", "Seven": "Sept", "Eight": "Huit", "Nine": "Neuf", "Ten": "Dix",
  "Today": "Aujourd'hui", "Tomorrow": "Demain", "Yesterday": "Hier",
  "Morning (early)": "Matin (tôt)", "Evening": "Soir", "Night": "Nuit",
  "Week": "Semaine", "Month": "Mois", "Year": "Année", "Now": "Maintenant",
  "Time": "Temps / Heure", "Monday": "Lundi", "Tuesday": "Mardi", "Wednesday": "Mercredi",
  "Thursday": "Jeudi", "Friday": "Vendredi", "Saturday": "Samedi", "Sunday": "Dimanche",
  // Places
  "School": "École", "Hospital": "Hôpital", "Bank": "Banque", "Post office": "Bureau de poste",
  "Airport": "Aéroport", "Hotel": "Hôtel", "Restaurant": "Restaurant", "Park": "Parc",
  "Library": "Bibliothèque", "Shop": "Magasin", "Store": "Magasin", "Market": "Marché",
  "Supermarket": "Supermarché", "Convenience store": "Konbini", "Temple": "Temple",
  "Shrine": "Sanctuaire", "Museum": "Musée", "Theater": "Théâtre",
  "Town / City": "Ville", "City": "Ville", "Town": "Bourg", "Country": "Pays",
  "Japan": "Japon", "Tokyo": "Tōkyō", "Road": "Route", "Street": "Rue",
  // Objects
  "Car": "Voiture", "Train": "Train", "Bus": "Bus", "Bicycle": "Vélo", "Book": "Livre",
  "Newspaper": "Journal", "Pen": "Stylo", "Bag": "Sac", "Key": "Clé",
  "Mobile phone": "Téléphone portable", "Computer": "Ordinateur", "Watch": "Montre",
  "Clock": "Horloge", "Door": "Porte", "Window": "Fenêtre", "Table": "Table",
  "Room": "Pièce / Chambre", "House": "Maison", "Money": "Argent", "Card": "Carte",
  "Ticket": "Billet / Ticket", "Photo": "Photo", "Camera": "Appareil photo",
  "Television": "Télévision", "Radio": "Radio", "Paper": "Papier",
  // Adjectives / Adverbs
  "Big": "Grand", "Small": "Petit", "Long": "Long", "Short": "Court",
  "High / Expensive": "Haut / Cher", "Low / Cheap": "Bas / Pas cher",
  "New": "Nouveau", "Old": "Vieux / Ancien", "Hot": "Chaud", "Cold": "Froid",
  "Good": "Bon", "Bad": "Mauvais", "Beautiful": "Beau / Belle", "Delicious": "Délicieux",
  "Fast": "Rapide", "Slow": "Lent", "Easy": "Facile", "Difficult": "Difficile",
  "Near": "Près", "Far": "Loin", "Many / Much": "Beaucoup", "Few / Little": "Peu",
  "Bright / Light": "Lumineux / Clair", "Dark": "Sombre", "Quiet": "Calme",
  "Noisy": "Bruyant", "Strong": "Fort", "Weak": "Faible", "Thick": "Épais", "Thin": "Mince",
  "Heavy": "Lourd", "Light (weight)": "Léger", "Fun": "Amusant",
  "Interesting": "Intéressant", "Boring": "Ennuyeux",
  // Verbs / actions
  "To eat": "Manger", "To drink": "Boire", "To see / watch": "Voir / Regarder",
  "To listen": "Écouter", "To speak": "Parler", "To read": "Lire",
  "To write": "Écrire", "To buy": "Acheter", "To sell": "Vendre",
  "To come": "Venir", "To return": "Retourner", "To sleep": "Dormir",
  "To wake up": "Se réveiller", "To stand": "Se lever", "To sit": "S'asseoir",
  "To open": "Ouvrir", "To close": "Fermer", "To give": "Donner",
  "To receive": "Recevoir", "To use": "Utiliser", "To make": "Faire / Fabriquer",
  "To work": "Travailler", "To study": "Étudier", "To play": "Jouer",
  "To like": "Aimer", "To understand": "Comprendre", "To know": "Savoir / Connaître",
  "To think": "Penser", "To wait": "Attendre", "To meet": "Rencontrer",
  "To start": "Commencer", "To finish": "Finir", "To put": "Mettre / Poser",
  "To have": "Avoir", "To exist (animate)": "Être / Exister", "To exist (inanimate)": "Être / Se trouver",
  "To enter": "Entrer", "To exit": "Sortir", "To turn right": "Tourner à droite",
  "To turn left": "Tourner à gauche", "To walk": "Marcher",
  "To run": "Courir", "To swim": "Nager", "To fly": "Voler",
  // Common expressions
  "Thank you": "Merci", "Excuse me": "Excusez-moi", "Sorry": "Désolé(e)",
  "Please": "S'il vous plaît", "Yes": "Oui", "No": "Non",
  "Good morning": "Bonjour (matin)", "Good afternoon": "Bon après-midi",
  "Good evening": "Bonsoir", "Good night": "Bonne nuit", "Goodbye": "Au revoir",
  "Hello": "Bonjour", "Welcome": "Bienvenue",
  // Misc
  "Price": "Prix", "How much": "Combien", "Where": "Où", "When": "Quand",
  "Why": "Pourquoi", "Who": "Qui", "What": "Quoi", "How": "Comment",
  "This": "Ceci / Ce", "That": "Cela / Ce", "Here": "Ici", "There": "Là",
  "I / Me": "Je / Moi", "You": "Tu / Vous", "He / She": "Il / Elle",
  "We": "Nous", "They": "Ils / Elles",
  "All": "Tout", "Nothing": "Rien", "Everyone": "Tout le monde",
  "Very": "Très", "Really": "Vraiment", "Maybe": "Peut-être",
  "Always": "Toujours", "Never": "Jamais", "Sometimes": "Parfois",
  "Together": "Ensemble", "Alone": "Seul(e)", "Outside": "Dehors",
  "Inside": "À l'intérieur", "Right": "Droite", "Left": "Gauche",
  "Straight": "Tout droit",
  // Japanese-specific
  "Sakura": "Sakura (fleur cerisier)", "Anime": "Anime", "Manga": "Manga",
  "Karate": "Karaté", "Judo": "Judo", "Sumo": "Sumo", "Kimono": "Kimono",
  "Futon": "Futon", "Tatami": "Tatami", "Yukata": "Yukata",
  "Katana": "Katana", "Samurai": "Samouraï", "Ninja": "Ninja",
  "Sensei": "Sensei (professeur)", "Senpai": "Senpai (aîné)",
  "Shrine (Jinja)": "Sanctuaire shinto",
  // Completed from the full SakuraFlow scrape
  "one (number)": "Un (chiffre)", "Octopus": "Poulpe", "Insect": "Insecte",
  "Peach": "Pêche", "Dream": "Rêve", "Crocodile": "Crocodile", "Garden": "Jardin",
  "Name": "Nom", "Tacos": "Tacos", "Tomato": "Tomate", "Cocoa": "Cacao",
  "Memo": "Mémo", "Knife": "Couteau", "Mask": "Masque", "Tennis": "Tennis",
  "University": "Université", "Study": "Étude", "Game": "Jeu", "Movie": "Film",
  "Meeting": "Réunion", "Family": "Famille", "Number": "Numéro / Nombre",
  "Cool": "Frais", "Cleaning": "Ménage", "Ship": "Bateau",
  "Cat": "Chat", "Dog": "Chien", "Summer": "Été", "Mushroom": "Champignon",
  // Chapitres 6-10 (vocabulaire & phrases N5)
  "Stamp": "Timbre", "Magazine": "Magazine", "Travel": "Voyage", "Cake": "Gâteau",
  "Shower": "Douche", "AM / Morning": "Matin (AM)", "PM / Afternoon": "Après-midi (PM)",
  "Who?": "Qui ?", "Where?": "Où ?", "When?": "Quand ?", "Which one?": "Lequel ?",
  "English": "Anglais", "German": "Allemand", "Japanese person": "Japonais(e)",
  "German person": "Allemand(e)", "I'm studying Japanese": "J'étudie le japonais",
  "I'm from _": "Je viens de _", "Yen": "Yen", "Souvenir": "Souvenir",
  "It's okay / I'm fine": "Ça va / Tout va bien",
  // Phrases & compteurs N5 (corrigent les mauvais matchs partiels)
  "Flower viewing": "Contemplation des fleurs (hanami)",
  "Two people": "Deux personnes", "Three people": "Trois personnes",
  "One piece": "Un objet", "Two pieces": "Deux objets",
  "I am _ years old": "J'ai _ ans", "How old are you?": "Quel âge as-tu ?",
  "Two o'clock": "Deux heures", "Three o'clock": "Trois heures",
  "What time is it?": "Quelle heure est-il ?", "What time is it now?": "Quelle heure est-il ?",
  "What is this?": "Qu'est-ce que c'est ?", "Where is _?": "Où est _ ?",
  "How much is it?": "Combien ça coûte ?", "This one please": "Celui-ci, s'il vous plaît",
  "Straight ahead": "Tout droit", "Six (Kanji)": "Six (六)", "Seven (Kanji)": "Sept (七)",
  "Eight (Kanji)": "Huit (八)", "Nine (Kanji)": "Neuf (九)", "Ten (Kanji)": "Dix (十)",
  "This (here)": "Ceci (ici)", "That (there)": "Cela (là)", "That (over there)": "Cela (là-bas)",
  "Town / city": "Ville", "Right": "Droite", "Left": "Gauche",
  "Train": "Train", "Station": "Gare", "Air": "Air",
};

function toFr(en) {
  if (!en) return null;
  // Direct match
  if (FR_DICT[en]) return FR_DICT[en];
  // Case-insensitive match
  const lower = en.toLowerCase();
  for (const [k, v] of Object.entries(FR_DICT)) {
    if (k.toLowerCase() === lower) return v;
  }
  // PAS de match partiel : il provoquait des traductions fausses
  // (« What time is it? » → « What » → « Quoi »). On marque pour complétion.
  return `${en} {!FR}`;
}

// ── Lesson emoji mapping ──────────────────────────────────────────────────────
const KANA_EMOJIS = {
  "あいうえお": "🌸", "かきくけこ": "🗡️", "さしすせそ": "🌊",
  "たちつてと": "🐙", "なにぬねの": "🎋", "はひふへほ": "🌺",
  "まみむめも": "🎵", "やゆよ": "🌙", "らりるれろ": "🌿",
  "わをん": "🎊",
  // Katakana rows
  "アイウエオ": "🔵", "カキクケコ": "⚔️", "サシスセソ": "🌀",
  "タチツテト": "🐉", "ナニヌネノ": "🎴", "ハヒフヘホ": "🌺",
  "マミムメモ": "🎶", "ヤユヨ": "🌕", "ラリルレロ": "⛩️",
  "ワヲン": "🎐",
};
const DEFAULT_KANA_EMOJI  = "🌸";
const DEFAULT_VOCAB_EMOJI = "💬";
const DEFAULT_REVIEW_EMOJI = "⭐";

// ── Kana → rōmaji table (single characters only) ─────────────────────────────
// Used to synthesize the rōmaji of a recovered first kana when neither the raw
// slide nor the deep scrape provide it.
const KANA2ROMAJI = {};
{
  const H = "あa いi うu えe おo かka きki くku けke こko さsa しshi すsu せse そso たta ちchi つtsu てte とto なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa をwo んn がga ぎgi ぐgu げge ごgo ざza じji ずzu ぜze ぞzo だda ぢji づzu でde どdo ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo";
  const K = "アa イi ウu エe オo カka キki クku ケke コko サsa シshi スsu セse ソso タta チchi ツtsu テte トto ナna ニni ヌnu ネne ノno ハha ヒhi フfu ヘhe ホho マma ミmi ムmu メme モmo ヤya ユyu ヨyo ラra リri ルru レre ロro ワwa ヲwo ンn ガga ギgi グgu ゲge ゴgo ザza ジji ズzu ゼze ゾzo ダda ヂji ヅzu デde ドdo バba ビbi ブbu ベbe ボbo パpa ピpi プpu ペpe ポpo";
  for (const tok of (H + " " + K).split(/\s+/)) {
    const ch = tok[0];
    KANA2ROMAJI[ch] = tok.slice(1);
  }
}
const isSingleKana = (s) => /^[ぁ-ゖァ-ヺ]$/.test(s);

// ── Parse a slide's rawText (works on raw.rawText and deep.fullText) ──────────
function parseSlideText(rt) {
  if (!rt) return null;

  // Vocab : "…NEW WORD\n<word>\nR\n<romaji>\n\n<meaning>\n\n(Back|Next|Start exercises)…"
  let m = rt.match(/\nNEW WORD\n([^\n]+)\nR\n([a-z]{1,18})\n\n([\s\S]+?)\n\n(?:Back|Next|Start exercises)/);
  if (m) {
    return { kind: "vocab", word: m[1].trim(), romaji: m[2].trim(), meaning: m[3].trim().replace(/\n+/g, " ") };
  }

  // Phrase (N5 grammar) : "…NEW PHRASE\n<phrase>\nR\n<romaji>\n\n<meaning>\n\n(💡|Back|Next|Start exercises)…"
  m = rt.match(/\nNEW PHRASE\n([^\n]+)\nR\n([^\n]+)\n\n([\s\S]+?)\n\n(?:💡|Back|Next|Start exercises)/);
  if (m) {
    return { kind: "vocab", word: m[1].trim(), romaji: m[2].trim(), meaning: m[3].trim().replace(/\n+/g, " ") };
  }

  // Kana (incl. yōon like し+ゃ on two lines) :
  //   "…(HIRAGANA|KATAKANA)\n<char>[\n<small>]\n(Stroke order|Writing…|R)\n…R\n<romaji>…"
  m = rt.match(/\n(HIRAGANA|KATAKANA)\n([\s\S]+?)\n(?:Stroke order|Writing…|R)\n/);
  if (m) {
    const script = m[1];
    const char = m[2].trim().replace(/\n/g, ""); // join base + small kana (yōon)
    const rM = rt.match(/\nR\n([a-z]{1,6})\n/);
    const dM = rt.match(/stands for the sound ([a-z]+)\./);
    const romaji = (rM && rM[1]) || (dM && dM[1]) || KANA2ROMAJI[char] || "";
    const mnM = rt.match(/Looks like…\n\n([\s\S]+?)\n\n(?:Back|Next|Start exercises)/);
    const mnemonic = mnM ? mnM[1].trim().replace(/\n+/g, " ") : "";
    const description = `This ${script.toLowerCase()} character stands for the sound ${romaji}.`;
    return { kind: "kana", script, char, romaji, mnemonic, description };
  }

  return null;
}

// ── "WHAT YOU'LL LEARN … Let's go!" ordered item list from the intro ─────────
function parseIntroList(allText) {
  if (!allText) return [];
  const m = allText.match(/WHAT YOU'LL LEARN\n([\s\S]*?)\nLet's go!/);
  if (!m) return [];
  return m[1].split("\n").map((s) => s.trim()).filter(Boolean);
}

// ── Clean image filename from its source URL ─────────────────────────────────
// kana : .../kana-mnemonics/hiragana/hiragana-a-apple.webp → a-apple.webp
// vocab: .../word-illustrations/unit1/ao.webp             → word-ao.webp
function cleanImageName(src) {
  if (!src) return null;
  const file = src.split("/").pop().split("?")[0];
  if (/\/kana-mnemonics\//.test(src)) return file.replace(/^(?:hiragana|katakana)-/, "");
  if (/\/word-illustrations\//.test(src)) return `word-${file}`;
  return file;
}

// ── Resolve the physical path of a downloaded asset (local path → disk) ───────
function physicalPath(localPath) {
  if (!localPath) return null;
  const rel = localPath.replace(/^\//, "");
  if (rel.startsWith("kana-mnemonics/")) return path.join(__dirname, "..", "public", rel);
  return path.join(__dirname, "..", rel); // sakuraflow_assets/… (project root)
}

// ── Copy a downloaded image to its clean name; return the public path ────────
let imagesCopied = 0;
function ensureImage(localPath, cleanName) {
  if (!cleanName) return "";
  const destFull = path.join(IMGS_DIR, cleanName);
  if (!fs.existsSync(destFull)) {
    const srcFull = physicalPath(localPath);
    if (srcFull && fs.existsSync(srcFull)) {
      try { fs.copyFileSync(srcFull, destFull); imagesCopied++; } catch {}
    }
  }
  return fs.existsSync(destFull) ? `/kana-mnemonics/${cleanName}` : "";
}

// ── Index the deep scrape (slide 1 captured) by char/word for first-item recovery ──
const DEEP_INDEX = new Map();
for (const dl of deep.lessons) {
  for (const s of dl.slides || []) {
    const it = parseSlideText(s.fullText);
    if (!it) continue;
    const tok = it.char || it.word;
    if (DEEP_INDEX.has(tok)) continue;
    if (it.kind === "kana" && !it.mnemonic && s.mnemonicText) it.mnemonic = s.mnemonicText.trim();
    const real = (s.images || []).find(
      (im) => !/base-sakuraflow/.test(im.src || "") && /relative|object-cover|select-none/.test(im.classes || "")
    );
    DEEP_INDEX.set(tok, { item: it, imgSrc: real && real.src, imgLocal: real && real.localPath });
  }
}

// ── The 10 SakuraFlow chapters (by real lesson number) ───────────────────────
// Vrais noms + nombres de leçons confirmés par l'utilisateur (cartes du cours).
// Les comptes (17+20+14+28+26+10+3+8+8+7) = 141 → frontières exactes.
const CHAPTER_STARTS = [1, 18, 38, 52, 80, 106, 116, 119, 127, 135];
function chapterOf(real) {
  if (!real) return 1;
  let c = 1;
  for (let i = 0; i < CHAPTER_STARTS.length; i++) if (real >= CHAPTER_STARTS[i]) c = i + 1;
  return c;
}
function realLessonNumber(lesson) {
  const m = (lesson.intro && lesson.intro.allText || "").match(/LESSON (\d+)\n/);
  return m ? +m[1] : null;
}

// ── Build a clean lesson from a raw lesson ───────────────────────────────────
function buildLesson(lesson, id) {
  // 1. Parse + dedupe the captured slides (items 2..N; last slide is duplicated)
  const byToken = new Map();
  const slideOrder = [];
  for (const slide of lesson.slides) {
    const it = parseSlideText(slide.rawText);
    if (!it) continue;
    const tok = it.char || it.word;
    if (byToken.has(tok)) continue;
    const img = (slide.imgs || []).find((i) => i.w > 100 && i.h > 100) || (slide.imgs || [])[0];
    byToken.set(tok, { item: it, imgSrc: img && img.src, imgLocal: img && img.local });
    slideOrder.push(tok);
  }
  if (byToken.size === 0) return null;

  // 2. Canonical order = intro list first (includes the missing item 1), then
  //    any captured token not present in the intro (rare, see L141).
  const ordered = [];
  const pushTok = (t) => { if (t && !ordered.includes(t)) ordered.push(t); };
  for (const t of parseIntroList(lesson.intro && lesson.intro.allText)) pushTok(t);
  for (const t of slideOrder) pushTok(t);

  // 3. Resolve each token → slide object (captured → deep → synthesized)
  const slides = [];
  for (const tok of ordered) {
    let entry = byToken.get(tok);
    if (!entry) entry = DEEP_INDEX.get(tok);            // recover missing first item
    if (!entry && isSingleKana(tok) && KANA2ROMAJI[tok]) {
      // Synthesize a kana with no mnemonic/image (stroke order still renders)
      const script = /[ァ-ヺ]/.test(tok) ? "KATAKANA" : "HIRAGANA";
      const romaji = KANA2ROMAJI[tok];
      entry = { item: { kind: "kana", script, char: tok, romaji, mnemonic: "",
        description: `This ${script.toLowerCase()} character stands for the sound ${romaji}.` } };
    }
    if (!entry) continue; // unknown first vocab word (no meaning anywhere) → skip

    const it = entry.item;
    const image = ensureImage(entry.imgLocal, cleanImageName(entry.imgSrc));

    if (it.kind === "kana") {
      slides.push({
        type: "kana",
        char: it.char,
        romaji: it.romaji,
        mnemonic: it.mnemonic || "",
        image,
        description: it.description,
      });
    } else {
      // N5 vocab/phrases (chapters 6-10) have no illustration on SakuraFlow —
      // keep them anyway (image stays "" and the player hides the picture).
      slides.push({
        type: "vocab",
        word: it.word,
        romaji: it.romaji,
        meaning: it.meaning,
        meaningFr: toFr(it.meaning),
        image,
      });
    }
  }

  return { realId: realLessonNumber(lesson), slides };
}

// ── Create slides without a scrape (authored content) ────────────────────────
function createKanaSlides(chars) {
  return (chars || []).map((tok) => {
    const script = /[ァ-ヺ]/.test(tok) ? "KATAKANA" : "HIRAGANA";
    const romaji = KANA2ROMAJI[tok] || "";
    return { type: "kana", char: tok, romaji, mnemonic: "", image: "",
      description: `Le caractère ${script === "KATAKANA" ? "katakana" : "hiragana"} pour le son « ${romaji} ».` };
  });
}
function createVocabSlides(vocab) {
  return (vocab || []).map((v) => ({
    type: "vocab", word: v.jp, romaji: v.romaji, meaning: v.fr, meaningFr: v.fr, image: "",
  }));
}

// ── Emoji + XP par type de leçon ─────────────────────────────────────────────
const KIND_EMOJI = { kana: "🌸", word: "💬", practice: "📝", review: "🔁", quiz: "🏆" };
function kindXp(kind, real) {
  if (kind === "quiz") return real === 141 ? 100 : 60;
  if (kind === "review") return 40;
  if (kind === "practice") return 15;
  return 20;
}

// ── Serialize a lesson to TS source ──────────────────────────────────────────
function serializeSlide(s) {
  if (s.type === "kana") {
    return `      { type: "kana", char: ${JSON.stringify(s.char)}, romaji: ${JSON.stringify(s.romaji)},
        mnemonic: ${JSON.stringify(s.mnemonic)},
        image: ${JSON.stringify(s.image)},
        description: ${JSON.stringify(s.description)} }`;
  } else {
    return `      { type: "vocab", word: ${JSON.stringify(s.word)}, romaji: ${JSON.stringify(s.romaji)},
        meaning: ${JSON.stringify(s.meaning)}, meaningFr: ${JSON.stringify(s.meaningFr)},
        image: ${JSON.stringify(s.image)} }`;
  }
}

function serializeLesson(l) {
  const slidesStr = l.slides.map(serializeSlide).join(",\n");
  return `  {
    id: ${l.id}, realId: ${l.realId}, chapter: ${l.chapter}, kind: ${JSON.stringify(l.kind)}, drill: ${l.drill},
    title: ${JSON.stringify(l.title)}, subtitle: ${JSON.stringify(l.subtitle)},
    emoji: ${JSON.stringify(l.emoji)}, xp: ${l.xp}, newCount: ${l.newCount},
    slides: [
${slidesStr}
    ],
  }`;
}

// ── Main : on construit TOUTES les 141 leçons depuis la métadonnée FR ─────────
const { META } = require("./french-course");

// Index du contenu scrapé par numéro réel
const scrapeByReal = new Map();
for (const rawLesson of raw.lessons) {
  const built = buildLesson(rawLesson);
  if (built && built.realId && !scrapeByReal.has(built.realId)) scrapeByReal.set(built.realId, built.slides);
}

const lessons = [];
for (const m of META) {
  const isContentKind = m.kind === "kana" || m.kind === "word";
  let slides = [];
  if (isContentKind) {
    if (scrapeByReal.has(m.real)) slides = scrapeByReal.get(m.real);     // contenu scrapé
    else if (m.kana) slides = createKanaSlides(m.kana);                  // kana créés
    else if (m.vocab) slides = createVocabSlides(m.vocab);              // vocab créé
  }
  const drill = slides.length === 0;
  // Une leçon de contenu sans slides devient un drill (exercices sur l'acquis).
  const kind = isContentKind && drill ? "practice" : m.kind;
  lessons.push({
    realId: m.real,
    chapter: chapterOf(m.real),
    kind,
    drill,
    title: m.title,
    subtitle: m.sub,
    emoji: KIND_EMOJI[kind] || "🌸",
    xp: kindXp(kind, m.real),
    newCount: slides.length,
    slides,
  });
}

lessons.sort((a, b) => a.realId - b.realId);
lessons.forEach((l, i) => { l.id = i + 1; });
const nDrill = lessons.filter((l) => l.drill).length;
console.log(`  ${lessons.length} leçons | ${lessons.length - nDrill} de contenu · ${nDrill} drills/quiz`);

// Check for French TODOs
const frTodos = lessons.flatMap(l => l.slides.filter(s => s.type === "vocab" && s.meaningFr?.includes("{!FR}")));
if (frTodos.length > 0) {
  console.warn(`\n⚠️  ${frTodos.length} traductions françaises manquantes (marquées {!FR}) :`);
  frTodos.slice(0, 20).forEach(s => console.warn(`   "${s.meaning}" → "${s.meaningFr}"`));
  if (frTodos.length > 20) console.warn(`   ... et ${frTodos.length - 20} autres`);
}

// ── Generate TypeScript ───────────────────────────────────────────────────────
const header = `// Auto-generated by scripts/convert-sakuraflow.js from SakuraFlow scrape
// Source: https://www.sakuraflow.app/basics — ${lessons.length} leçons
// Images: /public/kana-mnemonics/ (downloaded locally)
// DO NOT EDIT MANUALLY — regenerate with: node scripts/convert-sakuraflow.js

export type KanaSlide = {
  type: "kana";
  char: string;
  romaji: string;
  mnemonic: string;
  image: string;
  description: string;
};

export type VocabSlide = {
  type: "vocab";
  word: string;
  romaji: string;
  meaning: string;
  meaningFr: string;
  image: string;
};

export type Slide = KanaSlide | VocabSlide;

export type Exercise = {
  id: string;
  type: "kana_to_romaji" | "romaji_to_kana" | "word_to_meaning" | "meaning_to_word"
      | "write_romaji" | "write_jp";
  prompt: string;
  promptSub?: string;
  answer: string;        // bonne réponse à afficher
  choices: string[];     // vide pour les types "write_*"
  accept?: string[];     // saisies acceptées (normalisées) pour les "write_*"
};

export type LessonKind = "kana" | "word" | "practice" | "review" | "quiz";

export type BasicsLesson = {
  id: number;        // contiguous 1..N, in real course order (routing key)
  realId: number;    // original SakuraFlow lesson number
  chapter: number;   // 1..10 (see BASICS_CHAPTERS)
  kind: LessonKind;  // badge + comportement (contenu vs drill d'exercices)
  drill: boolean;    // true = pas de slides, exercices sur le vocabulaire acquis
  title: string;
  subtitle: string;
  emoji: string;
  xp: number;
  newCount: number;
  slides: Slide[];
};

export type BasicsChapter = { num: number; name: string; subtitle: string; total: number };

// Les 10 chapitres SakuraFlow — noms, sous-titres et nombre total de leçons
// exacts (issus du cours original). "total" = nombre de leçons SakuraFlow ;
// toutes ne sont pas encore jouables ici (les sessions de révision/quiz).
export const BASICS_CHAPTERS: BasicsChapter[] = [
  { num: 1,  name: "Hiragana — Début",            subtitle: "Premiers pas avec les hiragana",                 total: 17 },
  { num: 2,  name: "Hiragana au quotidien",       subtitle: "Plus de caractères et phrases du quotidien",     total: 20 },
  { num: 3,  name: "Hiragana complet",            subtitle: "Les rangées restantes : ま, や, ら, わ",           total: 14 },
  { num: 4,  name: "Katakana — Début",            subtitle: "À la découverte des caractères anguleux",        total: 28 },
  { num: 5,  name: "Maîtrise du katakana",        subtitle: "Maîtrise tous les katakana",                     total: 26 },
  { num: 6,  name: "Caractères spéciaux",         subtitle: "Maîtrise っ, les yōon et voyelles longues",       total: 10 },
  { num: 7,  name: "Nombres & premiers kanji",    subtitle: "ichi–juu et 一–十 : tes premiers kanji",          total: 3 },
  { num: 8,  name: "Compteurs & comptage",        subtitle: "ひとつ, 〜にん, 〜さい, 〜じ — compter en japonais",   total: 8 },
  { num: 9,  name: "Démonstratifs & questions",   subtitle: "これ・それ・あれ, mots interrogatifs et langues",   total: 8 },
  { num: 10, name: "Quotidien & expressions",     subtitle: "Phrases pratiques pour la vie au Japon",         total: 7 },
];

// ── Hiragana distractor pool ──────────────────────────────────────────────────
const ALL_HIRAGANA: { char: string; romaji: string }[] = [
  { char: "あ", romaji: "a" }, { char: "い", romaji: "i" }, { char: "う", romaji: "u" },
  { char: "え", romaji: "e" }, { char: "お", romaji: "o" },
  { char: "か", romaji: "ka" }, { char: "き", romaji: "ki" }, { char: "く", romaji: "ku" },
  { char: "け", romaji: "ke" }, { char: "こ", romaji: "ko" },
  { char: "さ", romaji: "sa" }, { char: "し", romaji: "shi" }, { char: "す", romaji: "su" },
  { char: "せ", romaji: "se" }, { char: "そ", romaji: "so" },
  { char: "た", romaji: "ta" }, { char: "ち", romaji: "chi" }, { char: "つ", romaji: "tsu" },
  { char: "て", romaji: "te" }, { char: "と", romaji: "to" },
  { char: "な", romaji: "na" }, { char: "に", romaji: "ni" }, { char: "ぬ", romaji: "nu" },
  { char: "ね", romaji: "ne" }, { char: "の", romaji: "no" },
  { char: "は", romaji: "ha" }, { char: "ひ", romaji: "hi" }, { char: "ふ", romaji: "fu" },
  { char: "へ", romaji: "he" }, { char: "ほ", romaji: "ho" },
  { char: "ま", romaji: "ma" }, { char: "み", romaji: "mi" }, { char: "む", romaji: "mu" },
  { char: "め", romaji: "me" }, { char: "も", romaji: "mo" },
  { char: "や", romaji: "ya" }, { char: "ゆ", romaji: "yu" }, { char: "よ", romaji: "yo" },
  { char: "ら", romaji: "ra" }, { char: "り", romaji: "ri" }, { char: "る", romaji: "ru" },
  { char: "れ", romaji: "re" }, { char: "ろ", romaji: "ro" },
  { char: "わ", romaji: "wa" }, { char: "を", romaji: "wo" }, { char: "ん", romaji: "n" },
  // Dakuten hiragana
  { char: "が", romaji: "ga" }, { char: "ぎ", romaji: "gi" }, { char: "ぐ", romaji: "gu" },
  { char: "げ", romaji: "ge" }, { char: "ご", romaji: "go" },
  { char: "ざ", romaji: "za" }, { char: "じ", romaji: "ji" }, { char: "ず", romaji: "zu" },
  { char: "ぜ", romaji: "ze" }, { char: "ぞ", romaji: "zo" },
  { char: "だ", romaji: "da" }, { char: "ぢ", romaji: "ji" }, { char: "づ", romaji: "zu" },
  { char: "で", romaji: "de" }, { char: "ど", romaji: "do" },
  { char: "ば", romaji: "ba" }, { char: "び", romaji: "bi" }, { char: "ぶ", romaji: "bu" },
  { char: "べ", romaji: "be" }, { char: "ぼ", romaji: "bo" },
  { char: "ぱ", romaji: "pa" }, { char: "ぴ", romaji: "pi" }, { char: "ぷ", romaji: "pu" },
  { char: "ぺ", romaji: "pe" }, { char: "ぽ", romaji: "po" },
];

const ALL_KATAKANA: { char: string; romaji: string }[] = [
  { char: "ア", romaji: "a" }, { char: "イ", romaji: "i" }, { char: "ウ", romaji: "u" },
  { char: "エ", romaji: "e" }, { char: "オ", romaji: "o" },
  { char: "カ", romaji: "ka" }, { char: "キ", romaji: "ki" }, { char: "ク", romaji: "ku" },
  { char: "ケ", romaji: "ke" }, { char: "コ", romaji: "ko" },
  { char: "サ", romaji: "sa" }, { char: "シ", romaji: "shi" }, { char: "ス", romaji: "su" },
  { char: "セ", romaji: "se" }, { char: "ソ", romaji: "so" },
  { char: "タ", romaji: "ta" }, { char: "チ", romaji: "chi" }, { char: "ツ", romaji: "tsu" },
  { char: "テ", romaji: "te" }, { char: "ト", romaji: "to" },
  { char: "ナ", romaji: "na" }, { char: "ニ", romaji: "ni" }, { char: "ヌ", romaji: "nu" },
  { char: "ネ", romaji: "ne" }, { char: "ノ", romaji: "no" },
  { char: "ハ", romaji: "ha" }, { char: "ヒ", romaji: "hi" }, { char: "フ", romaji: "fu" },
  { char: "ヘ", romaji: "he" }, { char: "ホ", romaji: "ho" },
  { char: "マ", romaji: "ma" }, { char: "ミ", romaji: "mi" }, { char: "ム", romaji: "mu" },
  { char: "メ", romaji: "me" }, { char: "モ", romaji: "mo" },
  { char: "ヤ", romaji: "ya" }, { char: "ユ", romaji: "yu" }, { char: "ヨ", romaji: "yo" },
  { char: "ラ", romaji: "ra" }, { char: "リ", romaji: "ri" }, { char: "ル", romaji: "ru" },
  { char: "レ", romaji: "re" }, { char: "ロ", romaji: "ro" },
  { char: "ワ", romaji: "wa" }, { char: "ヲ", romaji: "wo" }, { char: "ン", romaji: "n" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Exercise generation ───────────────────────────────────────────────────────
export function generateExercises(lesson: BasicsLesson): Exercise[] {
  const exercises: Exercise[] = [];
  const kanaSlides  = lesson.slides.filter((s): s is KanaSlide  => s.type === "kana");
  const vocabSlides = lesson.slides.filter((s): s is VocabSlide => s.type === "vocab");

  // Detect script (hiragana vs katakana)
  const isKatakana = kanaSlides.some(s => /[ア-ヶ]/.test(s.char));
  const distPool = isKatakana ? ALL_KATAKANA : ALL_HIRAGANA;

  for (const slide of kanaSlides) {
    const lessonRomajis = kanaSlides.map(k => k.romaji);

    const romajiSeen = new Set<string>();
    const romajiPool: string[] = [];
    for (const r of [...lessonRomajis, ...distPool.map(k => k.romaji)]) {
      if (r !== slide.romaji && !romajiSeen.has(r)) { romajiSeen.add(r); romajiPool.push(r); }
    }
    // Distracteurs kana : on exclut le bon caractère ET tout homophone
    // (même rōmaji, ex. じ/ぢ, づ/ず) pour éviter deux réponses correctes.
    const charSeen = new Set<string>();
    const charPool: string[] = [];
    for (const entry of [...kanaSlides, ...distPool]) {
      if (entry.char === slide.char || entry.romaji === slide.romaji) continue;
      if (charSeen.has(entry.char)) continue;
      charSeen.add(entry.char);
      charPool.push(entry.char);
    }

    exercises.push({
      id: \`\${lesson.id}-ktr-\${slide.romaji}\`,
      type: "kana_to_romaji",
      prompt: slide.char,
      promptSub: isKatakana ? "Comment se prononce ce katakana ?" : "Comment se prononce ce hiragana ?",
      answer: slide.romaji,
      choices: shuffle([slide.romaji, ...romajiPool.slice(0, 3)]),
    });
    exercises.push({
      id: \`\${lesson.id}-rtk-\${slide.char}\`,
      type: "romaji_to_kana",
      prompt: slide.romaji,
      promptSub: isKatakana ? "Quel est le katakana correspondant ?" : "Quel est le hiragana correspondant ?",
      answer: slide.char,
      choices: shuffle([slide.char, ...charPool.slice(0, 3)]),
    });
    // Saisie libre : on montre le kana, on écrit le rōmaji
    exercises.push({
      id: \`\${lesson.id}-wr-\${slide.char}\`,
      type: "write_romaji",
      prompt: slide.char,
      promptSub: isKatakana ? "Écris ce katakana en rōmaji" : "Écris ce hiragana en rōmaji",
      answer: slide.romaji,
      choices: [],
      accept: [slide.romaji],
    });
  }

  const allMeanings = vocabSlides.map(v => v.meaningFr);
  const allWords    = vocabSlides.map(v => v.word);
  const EXTRA_MEANINGS = ["Eau", "Maison", "Chat", "Soleil", "École", "Nuit", "Rue", "Jardin", "Livre", "Train", "Avion", "Mer", "Fleur", "Oiseau", "Vent"];

  for (const slide of vocabSlides) {
    // IMPORTANT : exclure la bonne réponse de TOUS les distracteurs (y compris
    // EXTRA_MEANINGS) sinon une carte distracteur peut être aussi correcte.
    const wrongMeanings = [...allMeanings, ...EXTRA_MEANINGS]
      .filter(m => m && m !== slide.meaningFr)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 3);
    exercises.push({
      id: \`\${lesson.id}-wtm-\${slide.romaji}\`,
      type: "word_to_meaning",
      prompt: slide.word,
      promptSub: slide.romaji,
      answer: slide.meaningFr,
      choices: shuffle([slide.meaningFr, ...wrongMeanings]),
    });

    const wrongWords = allWords.filter(w => w !== slide.word).slice(0, 3);
    if (wrongWords.length === 3) {
      exercises.push({
        id: \`\${lesson.id}-mtw-\${slide.romaji}\`,
        type: "meaning_to_word",
        prompt: slide.meaningFr,
        promptSub: "Choisir le mot japonais",
        answer: slide.word,
        choices: shuffle([slide.word, ...wrongWords]),
      });
    }
    // Saisie libre : on montre le sens français, on écrit le mot en japonais
    // (kana OU rōmaji accepté)
    exercises.push({
      id: \`\${lesson.id}-wj-\${slide.romaji}\`,
      type: "write_jp",
      prompt: slide.meaningFr,
      promptSub: "Écris le mot en japonais (kana ou rōmaji)",
      answer: slide.word,
      choices: [],
      accept: [slide.word, slide.romaji],
    });
  }

  return shuffle(exercises).slice(0, 16);
}

// ── Exercices pour une leçon, drills inclus ───────────────────────────────────
// Une leçon "drill" (practice/review/quiz sans slides) tire son vocabulaire des
// leçons de contenu déjà apprises : même chapitre pour un entraînement, tout le
// programme vu jusque-là pour une révision / un quiz.
export function buildLessonExercises(lesson: BasicsLesson, all: BasicsLesson[]): Exercise[] {
  if (!lesson.drill) return generateExercises(lesson);

  const pool = all.filter(
    (l) => !l.drill && l.slides.length > 0 && l.realId < lesson.realId &&
      (lesson.kind === "practice" ? l.chapter === lesson.chapter : l.chapter <= lesson.chapter)
  );
  let slides = pool.flatMap((l) => l.slides);
  // Repli : si rien dans la portée (rare), prendre tout l'acquis.
  if (slides.length === 0) {
    slides = all.filter((l) => !l.drill && l.realId < lesson.realId).flatMap((l) => l.slides);
  }
  const seen = new Set<string>();
  const uniq = slides.filter((s) => {
    const k = s.type === "kana" ? "k:" + s.char : "v:" + s.word;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  const count = lesson.kind === "quiz" ? 20 : 12;
  return generateExercises({ ...lesson, slides: shuffle(uniq).slice(0, count * 2) }).slice(0, count);
}

`;

const footer = `

export function getLesson(id: number): BasicsLesson | null {
  return ALL_LESSONS.find(l => l.id === id) ?? null;
}

export function lessonsByChapter(chapter: number): BasicsLesson[] {
  return ALL_LESSONS.filter(l => l.chapter === chapter);
}

// Chapitres réellement présents dans le contenu récupéré (avec au moins 1 leçon).
export const CHAPTERS_WITH_LESSONS: BasicsChapter[] =
  BASICS_CHAPTERS.filter(c => ALL_LESSONS.some(l => l.chapter === c.num));

// Rétro-compat : ancien export utilisé ailleurs.
export const CHAPTER1_LESSONS = lessonsByChapter(1);
`;

const body = `// ── Lesson data (${lessons.length} leçons) ─────────────────────────────────────────────────────
export const ALL_LESSONS: BasicsLesson[] = [
${lessons.map(serializeLesson).join(",\n")}
];`;

const output = header + body + footer;
fs.writeFileSync(OUT_TS, output, "utf8");

console.log(`\n✅  ${lessons.length} leçons écrites dans src/lib/basics-lessons.ts`);
console.log(`🖼️   ${imagesCopied} images copiées vers des noms propres dans public/kana-mnemonics/`);
console.log(`📊  ${lessons.filter(l=>l.slides.some(s=>s.type==="kana")).length} leçons kana`);
console.log(`📊  ${lessons.filter(l=>l.slides.every(s=>s.type==="vocab")).length} leçons vocabulaire`);
if (frTodos.length > 0) {
  console.log(`\n⚠️  Traductions manquantes : chercher "{!FR}" dans le fichier généré et compléter manuellement`);
}
