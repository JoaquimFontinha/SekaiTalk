/**
 * Métadonnées FRANÇAISES des 141 leçons du cours Basiques (récupéré de SakuraFlow
 * + complété pédagogiquement). Consommé par convert-sakuraflow.js.
 *
 * Chaque entrée : { real, kind, title, sub, [kana], [vocab] }
 *   kind: "kana" | "word"  → leçon de contenu (slides). Si le scrape n'a pas de
 *          slides ET qu'aucun `kana`/`vocab` n'est fourni, la leçon devient un
 *          drill (exercices sur le vocabulaire déjà appris).
 *   kind: "practice" | "review" | "quiz" → session d'exercices (pas de slides).
 *   kana:  ["ア","イ",...]      → crée des slides kana (rōmaji auto).
 *   vocab: [{jp,romaji,fr},...] → crée des slides vocabulaire.
 *
 * Tout est en français. Les titres anglais d'origine ont été traduits ;
 * les sessions non capturées ont été nommées d'après ce qu'elles révisent.
 */
const META = [
  // ── Chapitre 1 — Hiragana Start (L1–17) ──────────────────────────────────
  { real: 1,  kind: "kana", title: "あいうえお", sub: "Les 5 voyelles — tes tout premiers hiragana" },
  { real: 2,  kind: "word", title: "Premiers petits mots", sub: "あい・あお・うえ — applique tout de suite" },
  { real: 3,  kind: "practice", title: "Entraînement : les voyelles", sub: "Révision rapide de あいうえお" },
  { real: 4,  kind: "kana", title: "かきくけこ", sub: "La rangée K" },
  { real: 5,  kind: "word", title: "Mots en K", sub: "Tes premiers vrais mots avec か–こ" },
  { real: 6,  kind: "practice", title: "Entraînement : rangée K", sub: "Drille かきくけこ et les mots en K" },
  { real: 7,  kind: "practice", title: "Entraînement : rangée K", sub: "Révision rapide か–こ" },
  { real: 8,  kind: "word", title: "Mots en G (が–ご)", sub: "かぎ, えいが, かいぎ…" },
  { real: 9,  kind: "practice", title: "Entraînement : rangée G", sub: "Drille が–ご" },
  { real: 10, kind: "kana", title: "さしすせそ", sub: "La rangée S (し = shi)" },
  { real: 11, kind: "word", title: "Mots déjà lisibles", sub: "Ta première vraie lecture" },
  { real: 12, kind: "word", title: "Mots en S", sub: "Mots du quotidien avec さ–そ" },
  { real: 13, kind: "practice", title: "Entraînement : rangée S", sub: "Révision rapide さ–そ" },
  { real: 14, kind: "kana", title: "ざじずぜぞ", sub: "La rangée Z (dakuten de S, じ = ji)" },
  { real: 15, kind: "word", title: "Mots en Z", sub: "かぜ, かぞく, すうじ…" },
  { real: 16, kind: "practice", title: "Entraînement : mots en Z", sub: "かぜ, かぞく, すずしい…" },
  { real: 17, kind: "review", title: "Révision — Chapitre 1", sub: "Tout l'hiragana de base" },

  // ── Chapitre 2 — Everyday Hiragana (L18–37) ──────────────────────────────
  { real: 18, kind: "kana", title: "たちつてと", sub: "La rangée T (ち = chi, つ = tsu)" },
  { real: 19, kind: "word", title: "Mots en T", sub: "Premiers mots avec た–と" },
  { real: 20, kind: "practice", title: "Entraînement : rangée T", sub: "Drille たちつてと" },
  { real: 21, kind: "kana", title: "だぢづでど", sub: "La rangée D (dakuten de T)" },
  { real: 22, kind: "practice", title: "Entraînement : rangée D", sub: "Drille だ–ど" },
  { real: 23, kind: "practice", title: "Mots en D", sub: "どこ, かど, だいがく…" },
  { real: 24, kind: "kana", title: "なにぬねの", sub: "La rangée N" },
  { real: 25, kind: "word", title: "La rangée N & les animaux", sub: "ねこ, いぬ, なつ…" },
  { real: 26, kind: "practice", title: "Entraînement : rangée N", sub: "Révision rapide な–の" },
  { real: 27, kind: "kana", title: "はひふへほ", sub: "La rangée H (ふ = fu)" },
  { real: 28, kind: "word", title: "Mots en H", sub: "はな, ひと, ほし…" },
  { real: 29, kind: "practice", title: "Entraînement : rangée H", sub: "Drille はひふへほ" },
  { real: 30, kind: "kana", title: "ばびぶべぼ", sub: "La rangée B (dakuten de H)" },
  { real: 31, kind: "word", title: "Mots en B", sub: "そば, ぶた, ぼうし…" },
  { real: 32, kind: "practice", title: "Entraînement : rangée B", sub: "Drille ば–ぼ" },
  { real: 33, kind: "kana", title: "ぱぴぷぺぽ", sub: "La rangée P (handakuten de H)" },
  { real: 34, kind: "practice", title: "Entraînement : rangée P", sub: "Révision rapide ぱ–ぽ" },
  { real: 35, kind: "practice", title: "Entraînement : rangée P", sub: "Du son au caractère" },
  { real: 36, kind: "word", title: "Formules de politesse", sub: "Merci, pardon & se présenter" },
  { real: 37, kind: "review", title: "Révision 2", sub: "Révision express · 10 s par tâche" },

  // ── Chapitre 3 — Complete Hiragana (L38–51) ──────────────────────────────
  { real: 38, kind: "kana", title: "まみむめも", sub: "La rangée M" },
  { real: 39, kind: "word", title: "Mots en M", sub: "まめ, みみ, むし…" },
  { real: 40, kind: "practice", title: "Entraînement : rangée M", sub: "Drille まみむめも" },
  { real: 41, kind: "kana", title: "やゆよ", sub: "La rangée Y (seulement 3 caractères)" },
  { real: 42, kind: "word", title: "Mots en Y", sub: "やま, ゆめ, よむ" },
  { real: 43, kind: "practice", title: "Entraînement : rangée Y", sub: "Drille やゆよ" },
  { real: 44, kind: "kana", title: "らりるれろ", sub: "La rangée R" },
  { real: 45, kind: "word", title: "Mots en R", sub: "りす, そら, よる" },
  { real: 46, kind: "practice", title: "Entraînement : rangée R", sub: "Révision rapide ら–ろ" },
  { real: 47, kind: "kana", title: "わをん", sub: "Les 3 derniers : rangée W + ん" },
  { real: 48, kind: "practice", title: "Entraînement : わをん", sub: "Drille les derniers hiragana" },
  { real: 49, kind: "word", title: "Mots avec dakuten", sub: "でんわ, ぎんこう, だいがく…" },
  { real: 50, kind: "word", title: "Se présenter", sub: "はじめまして & よろしく" },
  { real: 51, kind: "quiz", title: "Méga Quiz Hiragana", sub: "Tout l'hiragana · 10 s par tâche" },

  // ── Chapitre 4 — Katakana Start (L52–79) ─────────────────────────────────
  { real: 52, kind: "kana", title: "アイウエオ", sub: "Les voyelles katakana", kana: ["ア","イ","ウ","エ","オ"] },
  { real: 53, kind: "word", title: "Mots-voyelles katakana", sub: "アイ, エア…" },
  { real: 54, kind: "practice", title: "Entraînement : voyelles katakana", sub: "Drille ア–オ" },
  { real: 55, kind: "kana", title: "カキクケコ", sub: "La rangée K (katakana)" },
  { real: 56, kind: "practice", title: "Entraînement : rangée K", sub: "Drille カキクケコ" },
  { real: 57, kind: "practice", title: "Mots en K (katakana)", sub: "Drille カ–コ et les mots K" },
  { real: 58, kind: "kana", title: "ガギグゲゴ", sub: "La rangée G (katakana)" },
  { real: 59, kind: "word", title: "Mots en G (katakana)", sub: "カギ, ケガ, ギガ…" },
  { real: 60, kind: "practice", title: "Entraînement : rangée G", sub: "Drille ガ–ゴ" },
  { real: 61, kind: "practice", title: "Entraînement : A, K & G", sub: "ア・カ・ガ katakana" },
  { real: 62, kind: "kana", title: "サシスセソ", sub: "La rangée S (シ = shi)" },
  { real: 63, kind: "word", title: "Mots en S (katakana)", sub: "ソロ, アイス, スイス…" },
  { real: 64, kind: "practice", title: "Entraînement : rangée S", sub: "Drille サ–ソ" },
  { real: 65, kind: "kana", title: "ザジズゼゾ", sub: "La rangée Z (katakana, ジ = ji)" },
  { real: 66, kind: "practice", title: "Entraînement : rangée Z", sub: "Drille ザ–ゾ" },
  { real: 67, kind: "word", title: "Mots en Z (katakana)", sub: "ガス, アジア…" },
  { real: 68, kind: "kana", title: "タチツテト", sub: "La rangée T (チ = chi, ツ = tsu)" },
  { real: 69, kind: "word", title: "Mots en T (katakana)", sub: "テスト, テキスト…" },
  { real: 70, kind: "practice", title: "Entraînement : rangée T", sub: "Drille タ–ト" },
  { real: 71, kind: "kana", title: "ダヂヅデド", sub: "La rangée D (katakana)" },
  { real: 72, kind: "practice", title: "Entraînement : rangée D", sub: "Drille ダ–ド" },
  { real: 73, kind: "practice", title: "Mots en D (katakana)", sub: "ドア, ガイド, ダイス…" },
  { real: 74, kind: "word", title: "Mots empruntés (katakana)", sub: "Les loanwords en japonais" },
  { real: 75, kind: "practice", title: "Entraînement : S, Z, T & D", sub: "Katakana mixte" },
  { real: 76, kind: "kana", title: "ナニヌネノ", sub: "La rangée N (katakana)" },
  { real: 77, kind: "word", title: "Mots en N (katakana)", sub: "ナイス, カナダ, テニス…" },
  { real: 78, kind: "practice", title: "Entraînement : rangée N", sub: "Drille ナ–ノ" },
  { real: 79, kind: "review", title: "Révision 3", sub: "Révision express · 10 s par tâche" },

  // ── Chapitre 5 — Katakana Master (L80–105) ───────────────────────────────
  { real: 80, kind: "kana", title: "ハヒフヘホ", sub: "La rangée H (フ = fu)" },
  { real: 81, kind: "word", title: "Mots en H (katakana)", sub: "ハイ, ヘイト…" },
  { real: 82, kind: "practice", title: "Entraînement : rangée H", sub: "Drille ハ–ホ" },
  { real: 83, kind: "kana", title: "バビブベボ", sub: "La rangée B (katakana)" },
  { real: 84, kind: "practice", title: "Entraînement : rangée B", sub: "Drille バ–ボ" },
  { real: 85, kind: "practice", title: "Mots en B (katakana)", sub: "バス, ビザ, バナナ…" },
  { real: 86, kind: "kana", title: "パピプペポ", sub: "La rangée P (handakuten)" },
  { real: 87, kind: "word", title: "Mots en P (katakana)", sub: "パス, ピザ, ポスト…" },
  { real: 88, kind: "practice", title: "Entraînement : rangée P", sub: "Drille パ–ポ" },
  { real: 89, kind: "kana", title: "マミムメモ", sub: "La rangée M (katakana)" },
  { real: 90, kind: "practice", title: "Entraînement : rangée M", sub: "Drille マ–モ" },
  { real: 91, kind: "practice", title: "Mots en M (katakana)", sub: "Drille マミムメモ" },
  { real: 92, kind: "word", title: "Mots du quotidien (katakana)", sub: "couteau, masque…" },
  { real: 93, kind: "practice", title: "Entraînement : H, B, P & M", sub: "Katakana mixte" },
  { real: 94, kind: "kana", title: "ヤユヨ", sub: "La rangée Y (katakana)" },
  { real: 95, kind: "word", title: "Mots en Y (katakana)", sub: "ヨガ, マヨ, ヤク" },
  { real: 96, kind: "practice", title: "Entraînement : rangée Y", sub: "Drille ヤ・ユ・ヨ" },
  { real: 97, kind: "kana", title: "ラリルレロ", sub: "La rangée R (katakana)" },
  { real: 98, kind: "practice", title: "Entraînement : rangée R", sub: "Drille ラ–ロ" },
  { real: 99, kind: "practice", title: "Mots en R (katakana)", sub: "Drille ラリルレロ" },
  { real: 100, kind: "kana", title: "ワヲン", sub: "Les derniers katakana" },
  { real: 101, kind: "word", title: "Mots en W & ン", sub: "ワイン, メロン, アイロン…" },
  { real: 102, kind: "practice", title: "Entraînement : ワ・ン", sub: "Drille les derniers katakana" },
  { real: 103, kind: "word", title: "Mots katakana avec dakuten", sub: "バス, ビール, ゲーム…" },
  { real: 104, kind: "practice", title: "Entraînement : dakuten katakana", sub: "Drille les sons voisés" },
  { real: 105, kind: "quiz", title: "Méga Quiz Katakana", sub: "Tout le katakana · 10 s par tâche" },

  // ── Chapitre 6 — Special Characters (L106–115) ───────────────────────────
  { real: 106, kind: "kana", title: "Petit っ / ッ", sub: "Les consonnes doubles (sokuon)" },
  { real: 107, kind: "kana", title: "しゃ・ちゃ", sub: "Yōon : sha, shu, sho, cha, chu, cho" },
  { real: 108, kind: "kana", title: "きゃ・にゃ・りゃ", sub: "Yōon : kya, nya, rya…" },
  { real: 109, kind: "word", title: "Mots avec yōon", sub: "おちゃ, しゃしん…" },
  { real: 110, kind: "practice", title: "Entraînement : yōon", sub: "Drille les sons contractés" },
  { real: 111, kind: "kana", title: "Voyelles longues ー", sub: "コーヒー, ケーキ, ラーメン" },
  { real: 112, kind: "word", title: "Grands mots empruntés", sub: "チョコレート, ジュース…" },
  { real: 113, kind: "practice", title: "Entraînement : voyelles longues & loanwords", sub: "コーヒー, チョコレート…" },
  { real: 114, kind: "practice", title: "Entraînement : sons spéciaux", sub: "Drille っ, yōon & voyelles longues" },
  { real: 115, kind: "quiz", title: "Méga Quiz Kana", sub: "Hiragana + katakana + dakuten + yōon" },

  // ── Chapitre 7 — Numbers & First Kanji (L116–118) ────────────────────────
  { real: 116, kind: "word", title: "Nombres 1–5 + Kanji", sub: "ichi–go et 一・二・三・四・五",
    vocab: [
      { jp: "いち", romaji: "ichi", fr: "Un (一)" }, { jp: "に", romaji: "ni", fr: "Deux (二)" },
      { jp: "さん", romaji: "san", fr: "Trois (三)" }, { jp: "よん", romaji: "yon", fr: "Quatre (四)" },
      { jp: "ご", romaji: "go", fr: "Cinq (五)" },
    ] },
  { real: 117, kind: "word", title: "Nombres 6–10 + Kanji", sub: "roku–juu et 六七八九十" },
  { real: 118, kind: "practice", title: "Entraînement : les nombres", sub: "Drille 1–10 et les kanji" },

  // ── Chapitre 8 — Counters & Counting (L119–126) ──────────────────────────
  { real: 119, kind: "word", title: "Compteurs ～つ", sub: "ひとつ, ふたつ, みっつ…",
    vocab: [
      { jp: "ひとつ", romaji: "hitotsu", fr: "Une chose" }, { jp: "ふたつ", romaji: "futatsu", fr: "Deux choses" },
      { jp: "みっつ", romaji: "mittsu", fr: "Trois choses" }, { jp: "よっつ", romaji: "yottsu", fr: "Quatre choses" },
    ] },
  { real: 120, kind: "word", title: "Compteurs", sub: "～にん, ～こ : personnes & objets" },
  { real: 121, kind: "practice", title: "Entraînement : compteurs", sub: "Drille ～にん, ～こ" },
  { real: 122, kind: "word", title: "Quel âge as-tu ?", sub: "なんさいですか？ ＿さいです" },
  { real: 123, kind: "word", title: "Quelle heure est-il ?", sub: "いまなんじですか" },
  { real: 124, kind: "practice", title: "Entraînement : âge & heure", sub: "Drille なんさい・なんじ" },
  { real: 125, kind: "practice", title: "Entraînement : nombres & heure", sub: "Révision avant le quiz" },
  { real: 126, kind: "quiz", title: "Méga Quiz Compteurs", sub: "Nombres, compteurs & heure" },

  // ── Chapitre 9 — Demonstratives & Questions (L127–134) ───────────────────
  { real: 127, kind: "word", title: "これ・それ・あれ", sub: "Ceci, cela, là-bas (par distance)" },
  { real: 128, kind: "practice", title: "Entraînement : これ・それ・あれ", sub: "Par distance" },
  { real: 129, kind: "practice", title: "Entraînement : démonstratifs", sub: "Drille これ・それ・あれ" },
  { real: 130, kind: "practice", title: "Entraînement : ここ・そこ・あそこ", sub: "Lieux + どこですか" },
  { real: 131, kind: "word", title: "Mots interrogatifs", sub: "なに, だれ, どこ, いつ, どれ" },
  { real: 132, kind: "word", title: "Langues & origine", sub: "にほんご, ドイツご, にほんじん" },
  { real: 133, kind: "practice", title: "Entraînement : questions", sub: "Drille les mots interrogatifs" },
  { real: 134, kind: "review", title: "Révision — Unité 9", sub: "Révision express · 10 s par tâche" },

  // ── Chapitre 10 — Everyday & Phrases (L135–141) ──────────────────────────
  { real: 135, kind: "word", title: "Achats & commande", sub: "いくらですか, ください" },
  { real: 136, kind: "word", title: "Maison & repas", sub: "ただいま, いただきます…" },
  { real: 137, kind: "practice", title: "Entraînement : maison & achats", sub: "Drille ただいま, いただきます & achats" },
  { real: 138, kind: "word", title: "Se déplacer", sub: "でんしゃ, えき, みぎ, ひだり" },
  { real: 139, kind: "practice", title: "Entraînement : se déplacer", sub: "Drille えき, みぎ, ひだり, まっすぐ" },
  { real: 140, kind: "review", title: "Révision du quotidien", sub: "Révision express · 10 s par tâche" },
  { real: 141, kind: "quiz", title: "Méga Quiz Final", sub: "Le grand test final · 10 s par tâche" },
];

module.exports = { META };
