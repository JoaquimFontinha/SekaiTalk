import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ElevenLabs voice IDs (eleven_multilingual_v2)
  const VOICE_KENJI = "TX3LPaxmHKxFdv7VOQHJ"; // Liam — male, calm
  const VOICE_HANA  = "XrExE9yKIg1WjnnlVkGX"; // Matilda — female, warm
  const VOICE_TARO  = "onwK4e9ZLuTAKqWW03F9"; // Daniel — male, authoritative

  // ── Scenes (décors liés aux POI) ────────────────────────────────────────────

  await prisma.scene.upsert({
    where: { poiId: "konbini-shinjuku" },
    update: {},
    create: {
      poiId: "konbini-shinjuku",
      backgroundImage: "/backgrounds/konbini.jpg",
      entrySound: "/sounds/konbini_enter.mp3",
      ambientSound: null,
    },
  });

  await prisma.scene.upsert({
    where: { poiId: "konbini-shibuya" },
    update: {},
    create: {
      poiId: "konbini-shibuya",
      backgroundImage: "/backgrounds/konbini.jpg",
      entrySound: "/sounds/konbini_enter.mp3",
      ambientSound: null,
    },
  });

  await prisma.scene.upsert({
    where: { poiId: "konbini-kyoto" },
    update: {},
    create: {
      poiId: "konbini-kyoto",
      backgroundImage: "/backgrounds/konbini.jpg",
      entrySound: "/sounds/konbini_enter.mp3",
      ambientSound: null,
    },
  });

  // ── Characters ──────────────────────────────────────────────────────────────

  const WORDS_KENJI = [
    { furigana: "", jp: "いらっしゃいませ！", romaji: "irasshaimase", fr: "bienvenue (formule de politesse)" },
    { furigana: "なに", jp: "何か", romaji: "nanika", fr: "quelque chose" },
    { furigana: "", jp: "お探しですか？", romaji: "osagashi desu ka", fr: "cherchez-vous ? (forme polie)" },
  ];
  const WORDS_HANA = [
    { furigana: "", jp: "こんにちは！", romaji: "konnichiwa", fr: "bonjour" },
    { furigana: "きょう", jp: "今日は", romaji: "kyou wa", fr: "aujourd'hui" },
    { furigana: "なに", jp: "何か", romaji: "nanika", fr: "quelque chose" },
    { furigana: "", jp: "ご入り用ですか？", romaji: "go-iriyo desu ka", fr: "avez-vous besoin de ? (très poli)" },
  ];
  const WORDS_TARO = [
    { furigana: "", jp: "いらっしゃいませ。", romaji: "irasshaimase", fr: "bienvenue" },
    { furigana: "きょうと", jp: "京都へ", romaji: "kyouto e", fr: "à Kyoto" },
    { furigana: "", jp: "ようこそ。", romaji: "youkoso", fr: "bienvenue (accueil)" },
    { furigana: "なに", jp: "何か", romaji: "nanika", fr: "quelque chose" },
    { furigana: "", jp: "お手伝いできることは", romaji: "otetsudai dekiru koto wa", fr: "ce en quoi je peux aider" },
    { furigana: "", jp: "ありますか？", romaji: "arimasu ka", fr: "y a-t-il ?" },
  ];

  await prisma.character.upsert({
    where: { id: "char-kenji" },
    update: { voiceId: VOICE_KENJI, greetingTranslation: "Bienvenue ! Cherchez-vous quelque chose ?", greetingWords: WORDS_KENJI },
    create: {
      id: "char-kenji",
      name: "Tanaka Kenji",
      nameJp: "田中 健二",
      role: "Vendeur de konbini",
      image: "/characters/konbini_vendor.png",
      voiceId: VOICE_KENJI,
      systemPrompt: `あなたは新宿のコンビニで働く田中健二です。
あなたは親切で少し内気な若い男性で、毎日同じお客さんたちと話すのを楽しんでいます。
あなたは必ず日本語だけで話してください。相手が英語やフランス語で話しかけてきても、日本語で答えてください。
会話は自然で短く、コンビニの日常的な内容（商品、天気、近所の出来事など）にしてください。
相手が日本語を学んでいる外国人であることを念頭に置き、少しゆっくり、分かりやすい言葉を使ってください。
絶対に日本語以外の言語を使わないでください。`,
      greetingMessage: "いらっしゃいませ！何かお探しですか？",
      greetingTranslation: "Bienvenue ! Cherchez-vous quelque chose ?",
      greetingWords: WORDS_KENJI,
      isFriendable: false,
      isActive: true,
    },
  });

  await prisma.character.upsert({
    where: { id: "char-hana" },
    update: { voiceId: VOICE_HANA, greetingTranslation: "Bonjour ! Avez-vous besoin de quelque chose aujourd'hui ?", greetingWords: WORDS_HANA },
    create: {
      id: "char-hana",
      name: "Yamamoto Hana",
      nameJp: "山本 花",
      role: "Caissière de konbini",
      image: "/characters/konbini_vendor.png",
      voiceId: VOICE_HANA,
      systemPrompt: `あなたは渋谷のコンビニで働く山本花です。
あなたは明るくて元気な若い女性で、お客さんと話すのが大好きです。
あなたは必ず日本語だけで話してください。相手が英語やフランス語で話しかけてきても、日本語で答えてください。
会話は自然で短く、コンビニの日常的な内容にしてください。
相手が日本語を学んでいる外国人であることを念頭に置き、ゆっくり、はっきりと話してください。
絶対に日本語以外の言語を使わないでください。`,
      greetingMessage: "こんにちは！今日は何かご入り用ですか？",
      greetingTranslation: "Bonjour ! Avez-vous besoin de quelque chose aujourd'hui ?",
      greetingWords: WORDS_HANA,
      isFriendable: true,
      isActive: true,
    },
  });

  await prisma.character.upsert({
    where: { id: "char-taro" },
    update: { voiceId: VOICE_TARO, greetingTranslation: "Bienvenue. Bienvenue à Kyoto. Y a-t-il quelque chose en quoi je peux vous aider ?", greetingWords: WORDS_TARO },
    create: {
      id: "char-taro",
      name: "Suzuki Taro",
      nameJp: "鈴木 太郎",
      role: "Gérant de konbini",
      image: "/characters/konbini_vendor.png",
      voiceId: VOICE_TARO,
      systemPrompt: `あなたは京都のコンビニを経営している鈴木太郎です。
あなたは落ち着いた中年の男性で、京都の文化や歴史についてよく知っています。
あなたは必ず日本語だけで話してください。相手が英語やフランス語で話しかけてきても、日本語で答えてください。
会話は自然で、コンビニの話題だけでなく、京都の観光地やおすすめスポットも教えてあげてください。
相手が日本語を学んでいる外国人であることを念頭に置き、丁寧な言葉を使ってください。
絶対に日本語以外の言語を使わないでください。`,
      greetingMessage: "いらっしゃいませ。京都へようこそ。何かお手伝いできることはありますか？",
      greetingTranslation: "Bienvenue. Bienvenue à Kyoto. Y a-t-il quelque chose en quoi je peux vous aider ?",
      greetingWords: WORDS_TARO,
      isFriendable: false,
      isActive: true,
    },
  });

  // ── CharacterAppearances (who appears at which POI) ─────────────────────────

  await prisma.characterAppearance.upsert({
    where: { characterId_poiId: { characterId: "char-kenji", poiId: "konbini-shinjuku" } },
    update: {},
    create: { characterId: "char-kenji", poiId: "konbini-shinjuku" },
  });

  await prisma.characterAppearance.upsert({
    where: { characterId_poiId: { characterId: "char-hana", poiId: "konbini-shibuya" } },
    update: {},
    create: { characterId: "char-hana", poiId: "konbini-shibuya" },
  });

  await prisma.characterAppearance.upsert({
    where: { characterId_poiId: { characterId: "char-taro", poiId: "konbini-kyoto" } },
    update: {},
    create: { characterId: "char-taro", poiId: "konbini-kyoto" },
  });

  // ── Quests ──────────────────────────────────────────────────────────────────
  const questExists = await prisma.quest.findUnique({
    where: { id: "quest-konbini-shinjuku-info-1" },
  });

  if (!questExists) {
    await prisma.quest.create({
      data: {
        id: "quest-konbini-shinjuku-info-1",
        poiId: "konbini-shinjuku",
        title: "Demander des informations 1",
        description: "Entraîne-toi à demander des informations sur les produits dans un konbini",
        order: 1,
        xpReward: 50,
        tasks: {
          create: [
            {
              id: "task-ks-i1-1",
              order: 1,
              instruction: "Demande où se trouvent les onigiri",
              aiContext:
                "L'utilisateur va te demander où sont les onigiri (おにぎり). " +
                "Réponds-lui qu'ils sont dans le réfrigérateur (冷蔵庫, れいぞうこ) au fond du magasin, sur l'étagère du bas.",
              choices: {
                create: [
                  { order: 1, text: "Dans le réfrigérateur au fond du magasin", isCorrect: true },
                  { order: 2, text: "À côté de la caisse", isCorrect: false },
                  { order: 3, text: "Dans la vitrine chauffante", isCorrect: false },
                  { order: 4, text: "Près de l'entrée du magasin", isCorrect: false },
                ],
              },
            },
            {
              id: "task-ks-i1-2",
              order: 2,
              instruction: "Demande quels parfums d'onigiri sont disponibles",
              aiContext:
                "L'utilisateur va te demander quels parfums d'onigiri sont disponibles. " +
                "Dis-lui qu'il y a du thon mayonnaise (ツナマヨ), du saumon (さけ) et de l'umeboshi (梅干し).",
              choices: {
                create: [
                  { order: 1, text: "Thon mayo, saumon et umeboshi", isCorrect: true },
                  { order: 2, text: "Seulement thon mayo et saumon", isCorrect: false },
                  { order: 3, text: "Poulet teriyaki et fromage", isCorrect: false },
                  { order: 4, text: "Crevette et oeuf", isCorrect: false },
                ],
              },
            },
            {
              id: "task-ks-i1-3",
              order: 3,
              instruction: "Demande combien coûte un onigiri",
              aiContext:
                "L'utilisateur va te demander le prix d'un onigiri. " +
                "Dis-lui que chaque onigiri coûte cent vingt yens (百二十円, ひゃくにじゅうえん).",
              choices: {
                create: [
                  { order: 1, text: "120 yens", isCorrect: true },
                  { order: 2, text: "80 yens", isCorrect: false },
                  { order: 3, text: "150 yens", isCorrect: false },
                  { order: 4, text: "200 yens", isCorrect: false },
                ],
              },
            },
            {
              id: "task-ks-i1-4",
              order: 4,
              instruction: "Demande si les onigiri sont frais d'aujourd'hui",
              aiContext:
                "L'utilisateur va te demander si les onigiri sont frais. " +
                "Confirme-lui qu'ils ont été livrés ce matin (今朝, けさ) et qu'ils sont très frais.",
              choices: {
                create: [
                  { order: 1, text: "Oui, livrés ce matin, très frais", isCorrect: true },
                  { order: 2, text: "Ils datent d'hier soir", isCorrect: false },
                  { order: 3, text: "Il ne sait pas quand ils ont été livrés", isCorrect: false },
                  { order: 4, text: "Non, ils sont un peu vieux", isCorrect: false },
                ],
              },
            },
            {
              id: "task-ks-i1-5",
              order: 5,
              instruction: "Remercie le vendeur et dis au revoir",
              aiContext:
                "L'utilisateur va te remercier et prendre congé. " +
                "Réponds-lui chaleureusement avec 'どういたしまして' (de rien), souhaite-lui une bonne journée (良い一日を) et dis-lui de revenir quand il veut (またいつでもどうぞ).",
              choices: {
                create: [
                  { order: 1, text: "Il t'a dit 'de rien' et t'a souhaité une bonne journée", isCorrect: true },
                  { order: 2, text: "Il t'a demandé si tu voulais payer maintenant", isCorrect: false },
                  { order: 3, text: "Il n'a pas répondu et s'est occupé d'un autre client", isCorrect: false },
                  { order: 4, text: "Il t'a proposé une carte de fidélité du magasin", isCorrect: false },
                ],
              },
            },
          ],
        },
      },
    });
    console.log("Quest 'Demander des informations 1' created for konbini-shinjuku.");
  }

  // ── Quest vocab (upsert so re-running seed keeps it up to date) ──────────────
  type VocabEntry = { jp: string; kana: string; romaji: string; fr: string; jlpt: number };
  const konbiniVocab: VocabEntry[] = [
    // N5
    { jp: "すみません",           kana: "すみません",           romaji: "sumimasen",           fr: "excusez-moi",           jlpt: 5 },
    { jp: "どこ",                 kana: "どこ",                 romaji: "doko",                fr: "où",                    jlpt: 5 },
    { jp: "おにぎり",             kana: "おにぎり",             romaji: "onigiri",             fr: "boulette de riz",       jlpt: 5 },
    { jp: "ありますか",           kana: "ありますか",           romaji: "arimasu ka",          fr: "est-ce qu'il y a ?",    jlpt: 5 },
    { jp: "いくら",               kana: "いくら",               romaji: "ikura",               fr: "combien ça coûte ?",    jlpt: 5 },
    { jp: "ありがとうございます", kana: "ありがとうございます", romaji: "arigatou gozaimasu",  fr: "merci beaucoup",        jlpt: 5 },
    { jp: "これ",                 kana: "これ",                 romaji: "kore",                fr: "ceci / celui-ci",       jlpt: 5 },
    { jp: "ください",             kana: "ください",             romaji: "kudasai",             fr: "s'il vous plaît / donnez-moi", jlpt: 5 },
    { jp: "いくつ",               kana: "いくつ",               romaji: "ikutsu",              fr: "combien (quantité)",    jlpt: 5 },
    { jp: "食べ物",               kana: "たべもの",             romaji: "tabemono",            fr: "nourriture",            jlpt: 5 },
    // N4
    { jp: "種類",                 kana: "しゅるい",             romaji: "shurui",              fr: "type, variété",         jlpt: 4 },
    { jp: "新鮮",                 kana: "しんせん",             romaji: "shinsen",             fr: "frais",                 jlpt: 4 },
    { jp: "冷蔵庫",               kana: "れいぞうこ",           romaji: "reizouko",            fr: "réfrigérateur",         jlpt: 4 },
    { jp: "今朝",                 kana: "けさ",                 romaji: "kesa",                fr: "ce matin",              jlpt: 4 },
    { jp: "弁当",                 kana: "べんとう",             romaji: "bentou",              fr: "bento / repas emporté", jlpt: 4 },
    { jp: "温める",               kana: "あたためる",           romaji: "atatameru",           fr: "chauffer / réchauffer", jlpt: 4 },
    { jp: "飲み物",               kana: "のみもの",             romaji: "nomimono",            fr: "boisson",               jlpt: 4 },
    { jp: "袋",                   kana: "ふくろ",               romaji: "fukuro",              fr: "sac",                   jlpt: 4 },
    { jp: "冷たい",               kana: "つめたい",             romaji: "tsumetai",            fr: "froid (au toucher)",    jlpt: 4 },
    { jp: "割り箸",               kana: "わりばし",             romaji: "waribashi",           fr: "baguettes jetables",    jlpt: 4 },
    // N3
    { jp: "会計",                 kana: "かいけい",             romaji: "kaikei",              fr: "addition / caisse",     jlpt: 3 },
    { jp: "レジ袋",               kana: "レジぶくろ",           romaji: "reji bukuro",         fr: "sac plastique caisse",  jlpt: 3 },
    { jp: "消費税",               kana: "しょうひぜい",         romaji: "shouhizei",           fr: "taxe à la consommation", jlpt: 3 },
    { jp: "お釣り",               kana: "おつり",               romaji: "otsuri",              fr: "monnaie rendue",        jlpt: 3 },
    { jp: "領収書",               kana: "りょうしゅうしょ",     romaji: "ryoushuusho",         fr: "reçu / facture",        jlpt: 3 },
  ];
  await prisma.quest.update({
    where: { id: "quest-konbini-shinjuku-info-1" },
    data: { vocab: konbiniVocab },
  });
  console.log("Quest vocab updated.");

  // ── Task suggestions (upsert so re-running seed keeps them up to date) ────────
  type SuggestionEntry = { fr: string; jp: string; romaji: string };
  const taskSuggestions: { id: string; suggestions: SuggestionEntry[] }[] = [
    {
      id: "task-ks-i1-1",
      suggestions: [
        { fr: "Excusez-moi",            jp: "すみません",               romaji: "sumimasen" },
        { fr: "Où sont les onigiri ?",  jp: "おにぎりはどこですか？",   romaji: "onigiri wa doko desu ka ?" },
        { fr: "Il y en a ?",            jp: "ありますか？",              romaji: "arimasu ka ?" },
      ],
    },
    {
      id: "task-ks-i1-2",
      suggestions: [
        { fr: "Quels parfums avez-vous ?", jp: "どんな種類がありますか？", romaji: "donna shurui ga arimasu ka ?" },
        { fr: "Thon mayonnaise",           jp: "ツナマヨ",                 romaji: "tsuna mayo" },
        { fr: "Saumon",                    jp: "さけ",                     romaji: "sake" },
        { fr: "Prune salée",              jp: "うめぼし",                 romaji: "umeboshi" },
      ],
    },
    {
      id: "task-ks-i1-3",
      suggestions: [
        { fr: "C'est combien ?",       jp: "いくらですか？",            romaji: "ikura desu ka ?" },
        { fr: "Un onigiri",            jp: "おにぎり一つ",              romaji: "onigiri hitotsu" },
        { fr: "Cent vingt yens",       jp: "百二十円",                  romaji: "hyaku ni-juu en" },
      ],
    },
    {
      id: "task-ks-i1-4",
      suggestions: [
        { fr: "C'est frais ?",         jp: "新鮮ですか？",              romaji: "shinsen desu ka ?" },
        { fr: "D'aujourd'hui ?",       jp: "今日のですか？",            romaji: "kyou no desu ka ?" },
        { fr: "Livré ce matin",        jp: "今朝届きましたか？",        romaji: "kesa todokimashita ka ?" },
      ],
    },
    {
      id: "task-ks-i1-5",
      suggestions: [
        { fr: "Merci beaucoup",        jp: "ありがとうございます",      romaji: "arigatou gozaimasu" },
        { fr: "Au revoir",             jp: "さようなら",                romaji: "sayounara" },
        { fr: "À bientôt !",           jp: "またいつでもどうぞ",        romaji: "mata itsu demo douzo" },
      ],
    },
  ];

  for (const { id, suggestions } of taskSuggestions) {
    await prisma.questTask.updateMany({ where: { id }, data: { suggestions } });
  }
  console.log("Task suggestions updated.");

  // ── Lessons ──────────────────────────────────────────────────────────────────

  const konbiniLesson = await prisma.lesson.upsert({
    where:  { poiId: "konbini-shinjuku" },
    update: { title: "Bienvenue au konbini !", description: "Vocabulaire et culture des épiceries japonaises 24h/24" },
    create: { poiId: "konbini-shinjuku", title: "Bienvenue au konbini !", description: "Vocabulaire et culture des épiceries japonaises 24h/24" },
  });

  // Recreate steps each time so the content stays fresh
  await prisma.lessonStep.deleteMany({ where: { lessonId: konbiniLesson.id } });
  await prisma.lessonStep.createMany({
    data: [
      {
        lessonId: konbiniLesson.id,
        order: 1,
        type: "INTRO",
        data: {
          word: "いらっしゃいませ",
          romaji: "irasshaimase",
          translation: "Bienvenue / Soyez le bienvenu",
          example: "Formule d'accueil obligatoire dans tous les konbini",
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 2,
        type: "INTRO",
        data: {
          word: "おにぎり",
          romaji: "onigiri",
          translation: "Triangle de riz farci",
          example: "La collation emblématique du konbini japonais",
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 3,
        type: "PRONUNCIATION",
        data: {
          word: "おにぎり",
          kana: "おにぎり",
          romaji: "o · ni · gi · ri",
          translation: "Triangle de riz farci",
          hint: "4 syllabes courtes et égales — prononce chaque voyelle distinctement",
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 4,
        type: "TRUE_FALSE",
        data: {
          statement: "« いくらですか » signifie « Combien ça coûte ? »",
          isTrue: true,
          explanation: "Correct ! 「いくら」(ikura) signifie « combien » et 「ですか」est la particule interrogative polie.",
          word: "いくらですか",
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 5,
        type: "CHOOSE_ANSWER",
        data: {
          question: "Comment demander si un article est disponible ?",
          choices: [
            { text: "ありますか？",       subtext: "arimasu ka?",       isCorrect: true  },
            { text: "いくらですか？",     subtext: "ikura desu ka?",     isCorrect: false },
            { text: "おねがいします",     subtext: "onegaishimasu",      isCorrect: false },
          ],
          explanation: "「ありますか？」signifie « Est-ce que vous en avez ? ». C'est la phrase clé pour chercher un produit.",
          translation: "Est-ce que vous en avez ?",
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 6,
        type: "CULTURE_NOTE",
        data: {
          title: "Le konbini, pilier de la vie japonaise",
          text: "Les コンビニ (konbini) sont des épiceries ouvertes 24h/24, 365 jours par an. On y trouve tout : おにぎり, bentō, médicaments, billets de spectacle et même des services bancaires. Le personnel salue chaque client avec 「いらっしゃいませ」.",
          vocab: [
            { word: "コンビニ",   kana: "こんびに",  translation: "convenience store" },
            { word: "おにぎり",                     translation: "triangle de riz"   },
            { word: "べんとう",                     translation: "repas box"          },
            { word: "レジ袋",    kana: "れじぶくろ", translation: "sac plastique"      },
          ],
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 7,
        type: "COMPLETE_WORD",
        data: {
          question: "Complète le mot.",
          prefix: "おに",
          suffix: "",
          answer: "ぎり",
          choices: ["ぎり", "ごり", "ぐり"],
          explanation: "「おにぎり」— le triangle de riz, star incontestée du konbini !",
          translation: "Triangle de riz",
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 8,
        type: "MATCH_PAIRS",
        data: {
          pairs: [
            { left: "いらっしゃいませ", right: "Bienvenue"       },
            { left: "おにぎり",         right: "Triangle de riz" },
            { left: "いくら",           right: "Combien"         },
            { left: "ありがとう",       right: "Merci"           },
          ],
        },
      },
      {
        lessonId: konbiniLesson.id,
        order: 9,
        type: "CHOOSE_ANSWER",
        data: {
          question: "Le caissier vous rend la monnaie. Comment le remerciez-vous poliment ?",
          choices: [
            { text: "ありがとうございます", subtext: "arigatou gozaimasu", isCorrect: true  },
            { text: "すみません",           subtext: "sumimasen",          isCorrect: false },
            { text: "いただきます",         subtext: "itadakimasu",        isCorrect: false },
          ],
          explanation: "「ありがとうございます」est la forme polie de « merci ». 「すみません」= excusez-moi, 「いただきます」= avant de manger.",
          translation: "Merci beaucoup",
        },
      },
    ],
  });
  console.log("Lesson seeded for konbini-shinjuku.");

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKYO EXPANSION — Scènes, Personnages, Apparitions, Quêtes, Leçons
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Scenes (upsert — null = pas de son pour ce POI) ─────────────────────────

  const TOKYO_SCENES: { poiId: string; entry?: string }[] = [
    { poiId: "haneda-airport" },
    { poiId: "tokyo-station-shinkansen" },
    { poiId: "jr-shinjuku" },
    { poiId: "nine-hours-shinjuku" },
    { poiId: "grand-hyatt-tokyo" },
    { poiId: "7eleven-shinjuku",       entry: "/sounds/konbini_enter.mp3" },
    { poiId: "familymart-shibuya",     entry: "/sounds/konbini_enter.mp3" },
    { poiId: "lawson-harajuku",        entry: "/sounds/konbini_enter.mp3" },
    { poiId: "matsumoto-kiyoshi-akiba" },
    { poiId: "tokyo-central-post" },
    { poiId: "starbucks-shibuya" },
    { poiId: "mcdonalds-shibuya" },
    { poiId: "asahi-super-dry-hall" },
    { poiId: "loft-shibuya" },
    { poiId: "shibuya-109" },
    { poiId: "donquijote-shibuya" },
    { poiId: "yodobashi-akiba" },
    { poiId: "lumine-est-shinjuku" },
    { poiId: "tokyo-skytree" },
    { poiId: "tokyo-tower" },
    { poiId: "meiji-jingu" },
    { poiId: "sensoji" },
    { poiId: "tokyo-national-museum" },
    { poiId: "tokyo-metro-theatre" },
    { poiId: "big-echo-kabukicho" },
    { poiId: "at-home-cafe-akihabara" },
    { poiId: "keio-hospital" },
  ];
  for (const s of TOKYO_SCENES) {
    await prisma.scene.upsert({
      where:  { poiId: s.poiId },
      update: {},
      create: { poiId: s.poiId, entrySound: s.entry ?? null, ambientSound: null },
    });
  }
  console.log("Tokyo scenes seeded.");

  // ── Characters ───────────────────────────────────────────────────────────────

  type CharSeed = {
    id: string; name: string; nameJp: string; role: string;
    greetingMessage: string; greetingTranslation: string;
    greetingWords: object[]; systemPrompt: string;
    isFriendable?: boolean;
  };

  const NEW_CHARS: CharSeed[] = [
    // ── Thème 1 : Transport ───────────────────────────────────────────────
    {
      id: "char-yuki",
      name: "Nakamura Yuki", nameJp: "中村 雪", role: "Agente d'accueil — Aéroport Haneda",
      greetingMessage: "ようこそ日本へ！パスポートをご提示ください。",
      greetingTranslation: "Bienvenue au Japon ! Veuillez présenter votre passeport.",
      greetingWords: [
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "にほん", jp: "日本へ", romaji: "nihon e", fr: "au Japon" },
        { furigana: "", jp: "パスポートを", romaji: "pasupooto wo", fr: "votre passeport (COD)" },
        { furigana: "", jp: "ご提示ください", romaji: "go-teiji kudasai", fr: "veuillez présenter" },
      ],
      systemPrompt: `あなたは羽田空港の入国審査官、中村雪です。丁寧で親切な女性です。旅行者のパスポート確認、入国目的、滞在期間、宿泊先を聞きます。日本語のみで話してください。`,
    },
    {
      id: "char-ryo",
      name: "Watanabe Ryō", nameJp: "渡辺 亮", role: "Agent JR — Gares de Tokyo",
      greetingMessage: "いらっしゃいませ！新幹線のご乗車ですか？",
      greetingTranslation: "Bienvenue ! Vous prenez le Shinkansen ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "しんかんせん", jp: "新幹線の", romaji: "shinkansen no", fr: "du Shinkansen" },
        { furigana: "じょうしゃ", jp: "ご乗車ですか", romaji: "go-jōsha desu ka", fr: "vous montez ?" },
      ],
      systemPrompt: `あなたはJRの駅員、渡辺亮です。新幹線や山手線など東京の交通案内を丁寧に行います。切符の買い方、乗り換え、出口の案内が得意です。日本語のみで話してください。`,
    },
    // ── Thème 2 : Hébergement ────────────────────────────────────────────
    {
      id: "char-mai",
      name: "Kimura Mai", nameJp: "木村 舞", role: "Réceptionniste — Nine Hours",
      greetingMessage: "こんにちは！ご予約のお名前をお聞かせください。",
      greetingTranslation: "Bonjour ! Puis-je avoir votre nom de réservation ?",
      greetingWords: [
        { furigana: "", jp: "こんにちは", romaji: "konnichiwa", fr: "bonjour" },
        { furigana: "よやく", jp: "ご予約の", romaji: "go-yoyaku no", fr: "de votre réservation" },
        { furigana: "", jp: "お名前をお聞かせください", romaji: "onamae wo okikase kudasai", fr: "veuillez nous donner votre nom" },
      ],
      systemPrompt: `あなたはナインアワーズ新宿のフロントスタッフ、木村舞です。カプセルホテルのチェックイン・チェックアウト、ロッカーの使い方、施設の説明を行います。日本語のみで話してください。`,
    },
    {
      id: "char-sora",
      name: "Inoue Sora", nameJp: "井上 蒼", role: "Concierge — Grand Hyatt Tokyo",
      greetingMessage: "いらっしゃいませ、グランドハイアット東京へようこそ。",
      greetingTranslation: "Bienvenue au Grand Hyatt Tokyo.",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "", jp: "グランドハイアット東京へ", romaji: "Grand Hyatt Tōkyō e", fr: "au Grand Hyatt Tokyo" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue (accueil)" },
      ],
      systemPrompt: `あなたはグランドハイアット東京のコンシェルジュ、井上蒼です。非常に丁寧な敬語を使います。チェックイン、レストラン予約、観光案内、ルームサービスの注文を対応します。日本語のみで話してください。`,
    },
    // ── Thème 3 : Quotidien ──────────────────────────────────────────────
    {
      id: "char-kai",
      name: "Aoki Kai", nameJp: "青木 海", role: "Vendeur — 7-Eleven Kabukichō",
      greetingMessage: "いらっしゃいませ！何かお探しですか？",
      greetingTranslation: "Bienvenue ! Vous cherchez quelque chose ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "なに", jp: "何か", romaji: "nanika", fr: "quelque chose" },
        { furigana: "", jp: "お探しですか", romaji: "osagashi desu ka", fr: "cherchez-vous ?" },
      ],
      systemPrompt: `あなたは歌舞伎町の7イレブンで働く青木海です。カジュアルで元気な若い男性です。商品の場所、ATM、コーヒーの種類など、コンビニに関する質問に答えます。日本語のみで話してください。`,
    },
    {
      id: "char-yuna",
      name: "Satō Yuna", nameJp: "佐藤 柚那", role: "Caissière — FamilyMart Shibuya",
      greetingMessage: "ファミリーマートへようこそ！今日は何になさいますか？",
      greetingTranslation: "Bienvenue chez FamilyMart ! Que puis-je faire pour vous aujourd'hui ?",
      greetingWords: [
        { furigana: "", jp: "ファミリーマートへ", romaji: "FamiryMāto e", fr: "chez FamilyMart" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "きょう", jp: "今日は", romaji: "kyou wa", fr: "aujourd'hui" },
        { furigana: "", jp: "何になさいますか", romaji: "nani ni nasaimasu ka", fr: "que prendrez-vous ?" },
      ],
      systemPrompt: `あなたは渋谷のファミリーマートで働く佐藤柚那です。明るくて親切な女性です。おにぎり、お弁当、スイーツ、カフェメニューなどコンビニの商品について説明します。日本語のみで話してください。`,
    },
    {
      id: "char-leo",
      name: "Hayashi Leo", nameJp: "林 玲央", role: "Gérant — Lawson Harajuku",
      greetingMessage: "いらっしゃいませ、ローソンへようこそ！",
      greetingTranslation: "Bienvenue chez Lawson !",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "", jp: "ローソンへ", romaji: "Rōson e", fr: "chez Lawson" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
      ],
      systemPrompt: `あなたは原宿のローソンを担当する林玲央です。スイーツ好きな穏やかな男性です。ウチカフェスイーツや季節限定商品が自慢です。日本語のみで話してください。`,
    },
    {
      id: "char-nana",
      name: "Ogawa Nana", nameJp: "小川 奈々", role: "Pharmacienne — Matsumoto Kiyoshi",
      greetingMessage: "こんにちは！ご用件をお聞かせください。",
      greetingTranslation: "Bonjour ! Comment puis-je vous aider ?",
      greetingWords: [
        { furigana: "", jp: "こんにちは", romaji: "konnichiwa", fr: "bonjour" },
        { furigana: "", jp: "ご用件を", romaji: "go-yōken wo", fr: "votre demande" },
        { furigana: "", jp: "お聞かせください", romaji: "okikase kudasai", fr: "veuillez nous faire part de" },
      ],
      systemPrompt: `あなたは秋葉原のマツモトキヨシで働く薬剤師の小川奈々です。症状に合った市販薬、スキンケア、ビタミン剤を提案します。外国人に分かりやすく説明します。日本語のみで話してください。`,
      isFriendable: true,
    },
    {
      id: "char-postal",
      name: "Tanaka Hiroshi", nameJp: "田中 博", role: "Agent — Bureau de Poste Central",
      greetingMessage: "いらっしゃいませ。何のご用件でしょうか？",
      greetingTranslation: "Bonjour. En quoi puis-je vous aider ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "", jp: "何のご用件でしょうか", romaji: "nan no go-yōken deshō ka", fr: "en quoi puis-je vous aider ?" },
      ],
      systemPrompt: `あなたは東京中央郵便局の職員、田中博です。海外小包の送り方、料金、EMS、書留、通常郵便について案内します。日本語のみで話してください。`,
    },
    // ── Thème 4 : Manger & Boire ─────────────────────────────────────────
    {
      id: "char-saki",
      name: "Fujii Saki", nameJp: "藤井 咲", role: "Barista — Starbucks Shibuya",
      greetingMessage: "こんにちは！ご注文はお決まりですか？",
      greetingTranslation: "Bonjour ! Avez-vous choisi votre commande ?",
      greetingWords: [
        { furigana: "", jp: "こんにちは", romaji: "konnichiwa", fr: "bonjour" },
        { furigana: "ちゅうもん", jp: "ご注文は", romaji: "go-chūmon wa", fr: "votre commande" },
        { furigana: "", jp: "お決まりですか", romaji: "okimari desu ka", fr: "vous avez choisi ?" },
      ],
      systemPrompt: `あなたは渋谷スクランブルスクエアのスターバックスで働くバリスタ、藤井咲です。コーヒーのサイズ（ショート、トール、グランデ、ベンティ）、カスタマイズ、季節限定メニューについて案内します。日本語のみで話してください。`,
    },
    {
      id: "char-mia",
      name: "Nishimura Mia", nameJp: "西村 美亜", role: "Caissière — McDonald's Shibuya",
      greetingMessage: "いらっしゃいませ！ご注文をどうぞ。",
      greetingTranslation: "Bienvenue ! Je vous écoute pour votre commande.",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "ちゅうもん", jp: "ご注文を", romaji: "go-chūmon wo", fr: "votre commande" },
        { furigana: "", jp: "どうぞ", romaji: "dōzo", fr: "je vous en prie / allez-y" },
      ],
      systemPrompt: `あなたは渋谷のマクドナルドの店員、西村美亜です。テリヤキバーガー、照り焼きチキン、マックフルーリーなど日本限定メニューも含めて注文を受け付けます。セットメニューやサイズ変更も対応します。日本語のみで話してください。`,
    },
    {
      id: "char-bartender",
      name: "Itō Ken", nameJp: "伊藤 健", role: "Barman — Asahi Super Dry Hall",
      greetingMessage: "いらっしゃい！アサヒビールはいかがですか？",
      greetingTranslation: "Bienvenue ! Une Asahi vous tente ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃい", romaji: "irasshai", fr: "bienvenue (familier)" },
        { furigana: "", jp: "アサヒビールは", romaji: "Asahi bīru wa", fr: "une bière Asahi" },
        { furigana: "", jp: "いかがですか", romaji: "ikaga desu ka", fr: "qu'en dites-vous ?" },
      ],
      systemPrompt: `あなたはアサヒスーパードライホールのバーテンダー、伊藤健です。気さくで豪快な男性です。アサヒビールの種類、おつまみ、スカイツリーの夜景について話します。日本語のみで話してください。`,
      isFriendable: true,
    },
    // ── Thème 5 : Shopping ───────────────────────────────────────────────
    {
      id: "char-daiki",
      name: "Matsuda Daiki", nameJp: "松田 大輝", role: "Conseiller — Loft Shibuya",
      greetingMessage: "いらっしゃいませ！何かお手伝いできますか？",
      greetingTranslation: "Bienvenue ! Puis-je vous aider ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "なに", jp: "何かお手伝い", romaji: "nanika otetsudai", fr: "quelque chose pour vous aider" },
        { furigana: "", jp: "できますか", romaji: "dekimasu ka", fr: "puis-je ?" },
      ],
      systemPrompt: `あなたは渋谷ロフトの販売員、松田大輝です。文房具、デザイン雑貨、旅行グッズを専門とします。ラッピングや贈り物探しも得意です。日本語のみで話してください。`,
    },
    {
      id: "char-yuko",
      name: "Nakashima Yuko", nameJp: "中島 由子", role: "Vendeuse — SHIBUYA109",
      greetingMessage: "いらっしゃいませ！今日は何をお探しですか？",
      greetingTranslation: "Bienvenue ! Vous cherchez quoi aujourd'hui ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "きょう", jp: "今日は", romaji: "kyou wa", fr: "aujourd'hui" },
        { furigana: "なに", jp: "何をお探しですか", romaji: "nani wo osagashi desu ka", fr: "que cherchez-vous ?" },
      ],
      systemPrompt: `あなたはSHIBUYA109のファッション販売員、中島由子です。トレンドに詳しく、服のサイズ（S・M・L）、色、素材、コーディネートを提案します。日本語のみで話してください。`,
    },
    {
      id: "char-kota",
      name: "Yamamoto Kota", nameJp: "山本 航太", role: "Vendeur — Mega Don Quijote",
      greetingMessage: "いらっしゃいませ！どこかお探しですか？",
      greetingTranslation: "Bienvenue ! Vous cherchez un rayon en particulier ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "", jp: "どこかお探しですか", romaji: "doko ka osagashi desu ka", fr: "cherchez-vous quelque chose quelque part ?" },
      ],
      systemPrompt: `あなたはドン・キホーテ渋谷の従業員、山本航太です。エネルギッシュで話が速いです。コスメ、スナック、電子機器など迷路のような店内を案内します。日本語のみで話してください。`,
    },
    {
      id: "char-yuji",
      name: "Endō Yuji", nameJp: "遠藤 勇二", role: "Expert — Yodobashi-Akiba",
      greetingMessage: "いらっしゃいませ！どのような商品をお探しですか？",
      greetingTranslation: "Bienvenue ! Quel type de produit recherchez-vous ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "", jp: "どのような商品を", romaji: "dono you na shōhin wo", fr: "quel type de produit" },
        { furigana: "", jp: "お探しですか", romaji: "osagashi desu ka", fr: "cherchez-vous ?" },
      ],
      systemPrompt: `あなたはヨドバシ秋葉原の電化製品スペシャリスト、遠藤勇二です。カメラ、パソコン、スマートフォン、ゲーム機について詳しく説明します。保証、ポイントカード、免税についても案内します。日本語のみで話してください。`,
    },
    {
      id: "char-aki",
      name: "Miura Aki", nameJp: "三浦 亜希", role: "Hôtesse — Lumine Est Shinjuku",
      greetingMessage: "いらっしゃいませ！ルミネエストへようこそ。",
      greetingTranslation: "Bienvenue chez Lumine Est !",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "", jp: "ルミネエストへ", romaji: "Lumine Est e", fr: "chez Lumine Est" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
      ],
      systemPrompt: `あなたはルミネエスト新宿のインフォメーションスタッフ、三浦亜希です。フロアガイド、各店舗の場所、セール情報、レストランの予約案内を担当します。日本語のみで話してください。`,
    },
    // ── Thème 6 : Découvrir Tokyo ────────────────────────────────────────
    {
      id: "char-ren",
      name: "Katō Ren", nameJp: "加藤 蓮", role: "Guide — Tokyo Skytree",
      greetingMessage: "ようこそ東京スカイツリーへ！チケットはお持ちですか？",
      greetingTranslation: "Bienvenue au Tokyo Skytree ! Avez-vous vos billets ?",
      greetingWords: [
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "とうきょう", jp: "東京スカイツリーへ", romaji: "Tōkyō Sukaitsurī e", fr: "au Tokyo Skytree" },
        { furigana: "", jp: "チケットはお持ちですか", romaji: "chiketto wa omochi desu ka", fr: "avez-vous vos billets ?" },
      ],
      systemPrompt: `あなたは東京スカイツリーのガイド、加藤蓮です。展望デッキ（350m）と展望回廊（450m）のチケット購入、所要時間、天気による眺望、フードコートについて案内します。日本語のみで話してください。`,
    },
    {
      id: "char-hiro",
      name: "Suzuki Hiro", nameJp: "鈴木 大", role: "Guide — Tokyo Tower",
      greetingMessage: "いらっしゃいませ！東京タワーへようこそ。",
      greetingTranslation: "Bienvenue à la Tour de Tokyo !",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "とうきょう", jp: "東京タワーへ", romaji: "Tōkyō Tawā e", fr: "à la Tour de Tokyo" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
      ],
      systemPrompt: `あなたは東京タワーのガイド、鈴木大です。1958年竣工のタワーの歴史、メインデッキ（150m）、トップデッキ（250m）のチケット、富士山の見え方について話します。日本語のみで話してください。`,
    },
    {
      id: "char-miko",
      name: "Shimizu Miko", nameJp: "清水 巫女", role: "Miko — Meiji Jingū",
      greetingMessage: "明治神宮へようこそ。どのようなご参拝でしょうか？",
      greetingTranslation: "Bienvenue au Meiji Jingū. Que souhaitez-vous faire ?",
      greetingWords: [
        { furigana: "めいじじんぐう", jp: "明治神宮へ", romaji: "Meiji Jingū e", fr: "au Meiji Jingū" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "さんぱい", jp: "ご参拝でしょうか", romaji: "go-sanpai deshō ka", fr: "pour vous recueillir ?" },
      ],
      systemPrompt: `あなたは明治神宮の巫女、清水です。参拝の作法（お辞儀、手水、賽銭、二拝二拍手一拝）、おみくじ、お守りの意味を丁寧に説明します。静かで落ち着いた口調で話します。日本語のみで話してください。`,
    },
    {
      id: "char-monk",
      name: "Tanaka Ryūsei", nameJp: "田中 龍星", role: "Prêtre — Sensō-ji",
      greetingMessage: "浅草寺へようこそ。お参りの方法をご説明しましょうか？",
      greetingTranslation: "Bienvenue au Sensō-ji. Voulez-vous que je vous explique comment prier ?",
      greetingWords: [
        { furigana: "せんそうじ", jp: "浅草寺へ", romaji: "Sensōji e", fr: "au Sensō-ji" },
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "おまいり", jp: "お参りの方法を", romaji: "omairi no hōhō wo", fr: "la méthode pour prier" },
      ],
      systemPrompt: `あなたは浅草寺の案内係、田中龍星です。仲見世通り、雷門、本堂でのお参りの作法、おみくじの引き方、お守りの購入を説明します。優しく穏やかな口調で話します。日本語のみで話してください。`,
    },
    {
      id: "char-curator",
      name: "Yamada Keiji", nameJp: "山田 啓二", role: "Conservateur — Musée National de Tokyo",
      greetingMessage: "ようこそ東京国立博物館へ。何かお探しでしょうか？",
      greetingTranslation: "Bienvenue au Musée National de Tokyo. Puis-je vous aider ?",
      greetingWords: [
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "とうきょうこくりつはくぶつかん", jp: "東京国立博物館へ", romaji: "Tōkyō Kokuritsu Hakubutsukan e", fr: "au Musée National de Tokyo" },
        { furigana: "なに", jp: "何かお探しでしょうか", romaji: "nanika osagashi deshō ka", fr: "cherchez-vous quelque chose ?" },
      ],
      systemPrompt: `あなたは東京国立博物館の学芸員、山田啓二です。博識で日本美術・歴史に情熱を持っています。展示室の場所、目玉展示品、音声ガイドレンタルについて案内します。日本語のみで話してください。`,
      isFriendable: true,
    },
    {
      id: "char-theater",
      name: "Kobayashi Emi", nameJp: "小林 絵美", role: "Ouvreuse — Théâtre Métropolitain",
      greetingMessage: "ようこそ東京芸術劇場へ。チケットをご確認させてください。",
      greetingTranslation: "Bienvenue au Théâtre Métropolitain. Puis-je voir votre billet ?",
      greetingWords: [
        { furigana: "", jp: "ようこそ", romaji: "youkoso", fr: "bienvenue" },
        { furigana: "とうきょうげいじゅつげきじょう", jp: "東京芸術劇場へ", romaji: "Tōkyō Geijutsu Gekijō e", fr: "au Théâtre Métropolitain" },
        { furigana: "", jp: "チケットをご確認", romaji: "chiketto wo go-kakunin", fr: "vérification de votre billet" },
      ],
      systemPrompt: `あなたは東京芸術劇場の案内スタッフ、小林絵美です。公演プログラム、座席の案内、クロークサービス、開演時間、休憩時間について説明します。日本語のみで話してください。`,
    },
    {
      id: "char-echo",
      name: "Nakamura Haru", nameJp: "中村 晴", role: "Staff — Big Echo Kabukichō",
      greetingMessage: "いらっしゃいませ！何名様ですか？",
      greetingTranslation: "Bienvenue ! Vous êtes combien ?",
      greetingWords: [
        { furigana: "", jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
        { furigana: "なんめい", jp: "何名様ですか", romaji: "nan-mei-sama desu ka", fr: "combien de personnes ?" },
      ],
      systemPrompt: `あなたはビッグエコー歌舞伎町のスタッフ、中村晴です。部屋の予約、フリータイム、ドリンクバー、曲の検索の仕方を案内します。カラオケのルールやエチケットも教えます。日本語のみで話してください。`,
    },
    {
      id: "char-maid",
      name: "Kawase Moe", nameJp: "川瀬 萌", role: "Maid — @home café Akihabara",
      greetingMessage: "おかえりなさいませ、ご主人様！今日もお帰りをお待ちしておりました！",
      greetingTranslation: "Bienvenue à la maison, maître ! Je vous attendais !",
      greetingWords: [
        { furigana: "", jp: "おかえりなさいませ", romaji: "okaerinasaimase", fr: "bienvenue à la maison" },
        { furigana: "ごしゅじんさま", jp: "ご主人様", romaji: "goshujin-sama", fr: "maître (terme respectueux)" },
        { furigana: "きょう", jp: "今日もお帰りを", romaji: "kyou mo okaeri wo", fr: "aujourd'hui aussi votre retour" },
        { furigana: "", jp: "お待ちしておりました", romaji: "omachi shite orimashita", fr: "j'attendais" },
      ],
      systemPrompt: `あなたは秋葉原の＠ほぉ～むカフェのメイド、川瀬萌です。ご主人様・お嬢様と呼びかけ、「おかえりなさいませ」で迎えます。メニューの紹介、オムライスのケチャップアート、一緒に呪文を唱えるサービスを提供します。かわいく元気に話します。日本語のみで話してください。`,
      isFriendable: true,
    },
    {
      id: "char-nurse",
      name: "Fujiwara Aya", nameJp: "藤原 彩", role: "Infirmière — Hôpital Keio",
      greetingMessage: "こんにちは。どのような症状でいらっしゃいますか？",
      greetingTranslation: "Bonjour. Quels sont vos symptômes ?",
      greetingWords: [
        { furigana: "", jp: "こんにちは", romaji: "konnichiwa", fr: "bonjour" },
        { furigana: "どのような", jp: "どのような症状で", romaji: "dono you na shōjō de", fr: "avec quels symptômes" },
        { furigana: "", jp: "いらっしゃいますか", romaji: "irasshaimasu ka", fr: "venez-vous ?" },
      ],
      systemPrompt: `あなたは慶應義塾大学病院の看護師、藤原彩です。症状の確認（熱、痛み、頭痛、胃の不調など）、診察の流れ、保険証・海外旅行保険の手続きについて丁寧に案内します。日本語のみで話してください。`,
    },
  ];

  for (const c of NEW_CHARS) {
    await prisma.character.upsert({
      where:  { id: c.id },
      update: { greetingTranslation: c.greetingTranslation, greetingWords: c.greetingWords },
      create: {
        ...c,
        image:    "/characters/default.png",
        voiceId:  null,
        isActive: true,
        isFriendable: c.isFriendable ?? false,
      },
    });
  }
  console.log("Tokyo characters seeded.");

  // ── CharacterAppearances ──────────────────────────────────────────────────────

  const APPEARANCES: { charId: string; poiId: string; ctx?: string }[] = [
    { charId: "char-yuki",      poiId: "haneda-airport" },
    { charId: "char-ryo",       poiId: "tokyo-station-shinkansen", ctx: "Tu travailles au guichet Shinkansen de la Gare de Tokyo. Tu aides les voyageurs à acheter leurs billets et à trouver leur quai." },
    { charId: "char-ryo",       poiId: "jr-shinjuku",              ctx: "Tu travailles au guichet JR de la Gare de Shinjuku. Tu aides les voyageurs à comprendre le réseau, trouver leur sortie et acheter une IC card." },
    { charId: "char-mai",       poiId: "nine-hours-shinjuku" },
    { charId: "char-sora",      poiId: "grand-hyatt-tokyo" },
    { charId: "char-kai",       poiId: "7eleven-shinjuku" },
    { charId: "char-yuna",      poiId: "familymart-shibuya" },
    { charId: "char-leo",       poiId: "lawson-harajuku" },
    { charId: "char-nana",      poiId: "matsumoto-kiyoshi-akiba" },
    { charId: "char-postal",    poiId: "tokyo-central-post" },
    { charId: "char-saki",      poiId: "starbucks-shibuya" },
    { charId: "char-mia",       poiId: "mcdonalds-shibuya" },
    { charId: "char-bartender", poiId: "asahi-super-dry-hall" },
    { charId: "char-daiki",     poiId: "loft-shibuya" },
    { charId: "char-yuko",      poiId: "shibuya-109" },
    { charId: "char-kota",      poiId: "donquijote-shibuya" },
    { charId: "char-yuji",      poiId: "yodobashi-akiba" },
    { charId: "char-aki",       poiId: "lumine-est-shinjuku" },
    { charId: "char-ren",       poiId: "tokyo-skytree" },
    { charId: "char-hiro",      poiId: "tokyo-tower" },
    { charId: "char-miko",      poiId: "meiji-jingu" },
    { charId: "char-monk",      poiId: "sensoji" },
    { charId: "char-curator",   poiId: "tokyo-national-museum" },
    { charId: "char-theater",   poiId: "tokyo-metro-theatre" },
    { charId: "char-echo",      poiId: "big-echo-kabukicho" },
    { charId: "char-maid",      poiId: "at-home-cafe-akihabara" },
    { charId: "char-nurse",     poiId: "keio-hospital" },
  ];
  for (const a of APPEARANCES) {
    await prisma.characterAppearance.upsert({
      where:  { characterId_poiId: { characterId: a.charId, poiId: a.poiId } },
      update: { locationContext: a.ctx ?? null },
      create: { characterId: a.charId, poiId: a.poiId, locationContext: a.ctx ?? null },
    });
  }
  console.log("Tokyo character appearances seeded.");

  // ── Quêtes Tokyo ─────────────────────────────────────────────────────────────

  type QTask = { id: string; order: number; instruction: string; aiContext: string; choices: { order: number; text: string; isCorrect: boolean }[] };
  type QSeed = { id: string; poiId: string; title: string; description: string; order: number; xp: number; tasks: QTask[] };

  const TOKYO_QUESTS: QSeed[] = [
    // ── Thème 1 : Transport ────────────────────────────────────────────────────
    {
      id: "quest-haneda-1", poiId: "haneda-airport", order: 1, xp: 60,
      title: "Passer l'immigration",
      description: "Franchis le contrôle des passeports et explique le but de ton séjour.",
      tasks: [
        { id: "t-han-1-1", order: 1, instruction: "Présente ton passeport et dis bonjour à l'agent",
          aiContext: "L'utilisateur arrive à l'immigration. Demande-lui son passeport et accueille-le poliment.",
          choices: [{ order:1, text:"Tu as présenté ton passeport et dit 'こんにちは'", isCorrect:true },{ order:2, text:"Tu as dit ton nom sans passeport", isCorrect:false },{ order:3, text:"Tu as parlé en anglais", isCorrect:false }] },
        { id: "t-han-1-2", order: 2, instruction: "Dis que tu viens pour le tourisme (観光)",
          aiContext: "Demande à l'utilisateur le but de son séjour. Attends qu'il dise 観光 (tourisme).",
          choices: [{ order:1, text:"L'agent a compris : tu viens en touriste", isCorrect:true },{ order:2, text:"L'agent pense que tu viens pour le travail", isCorrect:false },{ order:3, text:"L'agent n'a pas compris", isCorrect:false }] },
        { id: "t-han-1-3", order: 3, instruction: "Dis combien de jours tu restes (例：7日間)",
          aiContext: "Demande la durée du séjour. L'utilisateur doit préciser le nombre de jours ou de semaines.",
          choices: [{ order:1, text:"L'agent a noté la durée exacte de ton séjour", isCorrect:true },{ order:2, text:"L'agent n'a pas eu de réponse claire", isCorrect:false },{ order:3, text:"Tu as dit une durée impossible", isCorrect:false }] },
      ],
    },
    {
      id: "quest-haneda-2", poiId: "haneda-airport", order: 2, xp: 50,
      title: "Rejoindre le centre-ville",
      description: "Demande comment prendre le bus limousine jusqu'à Shinjuku.",
      tasks: [
        { id: "t-han-2-1", order: 1, instruction: "Demande où se trouvent les bus pour Shinjuku",
          aiContext: "L'utilisateur cherche le bus limousine pour Shinjuku. Indique-lui le terminal de bus au niveau B1.",
          choices: [{ order:1, text:"L'agent t'a indiqué le terminal B1", isCorrect:true },{ order:2, text:"L'agent t'a envoyé au train", isCorrect:false },{ order:3, text:"L'agent n'a pas compris ta destination", isCorrect:false }] },
        { id: "t-han-2-2", order: 2, instruction: "Demande le prix et la durée du trajet",
          aiContext: "L'utilisateur veut connaître le prix (1300 yens) et la durée (50 minutes) du bus limousine.",
          choices: [{ order:1, text:"Tu sais que c'est 1300¥ et ~50 minutes", isCorrect:true },{ order:2, text:"Tu n'as obtenu que le prix", isCorrect:false },{ order:3, text:"Tu n'as pas compris la durée", isCorrect:false }] },
        { id: "t-han-2-3", order: 3, instruction: "Achète ton billet et dis merci",
          aiContext: "L'utilisateur achète son billet de bus. Complète la transaction avec un remerciement.",
          choices: [{ order:1, text:"Transaction réussie, tu as remercié poliment", isCorrect:true },{ order:2, text:"Tu as oublié de remercier", isCorrect:false },{ order:3, text:"Tu as payé le mauvais montant", isCorrect:false }] },
      ],
    },
    {
      id: "quest-shinkansen-1", poiId: "tokyo-station-shinkansen", order: 1, xp: 70,
      title: "Acheter un billet Shinkansen",
      description: "Achète un billet pour Kyoto en Shinkansen, siège fenêtre non-fumeur.",
      tasks: [
        { id: "t-shk-1-1", order: 1, instruction: "Demande un aller simple pour Kyoto",
          aiContext: "L'utilisateur veut un billet de Shinkansen pour Kyoto. Demande-lui quelle classe (自由席 ou 指定席).",
          choices: [{ order:1, text:"L'agent a compris : aller simple pour Kyoto", isCorrect:true },{ order:2, text:"L'agent a réservé un aller-retour", isCorrect:false },{ order:3, text:"Tu as demandé Osaka par erreur", isCorrect:false }] },
        { id: "t-shk-1-2", order: 2, instruction: "Précise : siège réservé, côté fenêtre, non-fumeur",
          aiContext: "L'utilisateur précise ses préférences de siège : 指定席, 窓側, 禁煙席.",
          choices: [{ order:1, text:"L'agent a bien noté tes préférences de siège", isCorrect:true },{ order:2, text:"L'agent a réservé côté couloir", isCorrect:false },{ order:3, text:"Tu n'as pas précisé non-fumeur", isCorrect:false }] },
        { id: "t-shk-1-3", order: 3, instruction: "Confirme le prix et paye",
          aiContext: "Le billet pour Kyoto en Shinkansen coûte environ 13 720 yens. L'utilisateur doit confirmer et payer.",
          choices: [{ order:1, text:"Paiement effectué, tu as ton billet", isCorrect:true },{ order:2, text:"Tu as refusé en entendant le prix", isCorrect:false },{ order:3, text:"Tu as oublié de vérifier la date", isCorrect:false }] },
      ],
    },
    {
      id: "quest-jr-1", poiId: "jr-shinjuku", order: 1, xp: 55,
      title: "S'orienter à Shinjuku",
      description: "Trouve la bonne sortie et achète une carte IC pour les transports.",
      tasks: [
        { id: "t-jr-1-1", order: 1, instruction: "Demande quelle sortie pour Kabukichō (東口 ou 南口 ?)",
          aiContext: "L'utilisateur cherche la sortie pour Kabukichō. C'est la 東口 (sortie Est). Explique comment y aller.",
          choices: [{ order:1, text:"L'agent t'a dit d'aller à la 東口 (sortie Est)", isCorrect:true },{ order:2, text:"L'agent t'a envoyé à la sortie Sud", isCorrect:false },{ order:3, text:"L'agent n'a pas compris Kabukichō", isCorrect:false }] },
        { id: "t-jr-1-2", order: 2, instruction: "Demande comment acheter une carte Suica",
          aiContext: "L'utilisateur veut une carte Suica (ICカード). Explique qu'il faut aller aux machines automatiques (自動券売機), déposer 500¥ de caution + le montant souhaité.",
          choices: [{ order:1, text:"Tu sais maintenant comment acheter une Suica", isCorrect:true },{ order:2, text:"L'agent t'a renvoyé au guichet principal", isCorrect:false },{ order:3, text:"Tu pensais que la Suica était gratuite", isCorrect:false }] },
        { id: "t-jr-1-3", order: 3, instruction: "Demande quelle ligne pour aller à Shibuya",
          aiContext: "L'utilisateur veut aller à Shibuya. C'est la ligne Yamanote (山手線), direction Shibuya/Osaki, environ 5 stations.",
          choices: [{ order:1, text:"L'agent t'a dit la ligne Yamanote, direction Shibuya", isCorrect:true },{ order:2, text:"L'agent t'a envoyé sur la mauvaise ligne", isCorrect:false },{ order:3, text:"Tu as demandé Akihabara par erreur", isCorrect:false }] },
      ],
    },
    // ── Thème 2 : Hébergement ───────────────────────────────────────────────────
    {
      id: "quest-ninehours-1", poiId: "nine-hours-shinjuku", order: 1, xp: 50,
      title: "Check-in au Nine Hours",
      description: "Effectue ton check-in dans ce capsule hôtel design de Shinjuku.",
      tasks: [
        { id: "t-nh-1-1", order: 1, instruction: "Donne ton nom et numéro de réservation",
          aiContext: "L'utilisateur fait son check-in. Demande son nom et vérifie la réservation.",
          choices: [{ order:1, text:"Check-in confirmé avec ton nom", isCorrect:true },{ order:2, text:"Le nom n'a pas été trouvé dans le système", isCorrect:false },{ order:3, text:"Tu as donné le mauvais nom", isCorrect:false }] },
        { id: "t-nh-1-2", order: 2, instruction: "Demande l'heure du check-out et les règles du casier",
          aiContext: "L'utilisateur veut connaître le check-out (10h00) et comment fonctionne le casier (locker key, code).",
          choices: [{ order:1, text:"Tu sais : check-out à 10h, casier avec ta clé", isCorrect:true },{ order:2, text:"Tu n'as pas compris l'heure du check-out", isCorrect:false },{ order:3, text:"Tu pensais que le check-out était à midi", isCorrect:false }] },
        { id: "t-nh-1-3", order: 3, instruction: "Demande où sont les douches et le pyjama",
          aiContext: "L'utilisateur demande les équipements : douches communes (共用シャワー, 3ème étage), pyjama fourni dans la capsule.",
          choices: [{ order:1, text:"Tu as trouvé les douches et reçu un pyjama", isCorrect:true },{ order:2, text:"Tu pensais que les douches étaient dans la capsule", isCorrect:false },{ order:3, text:"Tu as oublié de demander le pyjama", isCorrect:false }] },
      ],
    },
    {
      id: "quest-hyatt-1", poiId: "grand-hyatt-tokyo", order: 1, xp: 80,
      title: "Séjour au Grand Hyatt",
      description: "Check-in dans ce palace de Roppongi et commande le room service.",
      tasks: [
        { id: "t-hy-1-1", order: 1, instruction: "Dis que tu as une réservation et demande si un upgrade est possible",
          aiContext: "L'utilisateur fait son check-in et demande poliment un upgrade de chambre. Si la suite junior est disponible, propose-la avec une légère surcharge.",
          choices: [{ order:1, text:"Le concierge a vérifié et propose une meilleure chambre", isCorrect:true },{ order:2, text:"Aucun upgrade disponible ce soir", isCorrect:false },{ order:3, text:"Tu n'as pas osé demander l'upgrade", isCorrect:false }] },
        { id: "t-hy-1-2", order: 2, instruction: "Commande le room service : soba froide et thé vert",
          aiContext: "L'utilisateur commande par téléphone : ざる蕎麦 (soba froide) et お茶 (thé vert). Note la commande et annonce un délai de 30 minutes.",
          choices: [{ order:1, text:"Commande passée : soba et thé dans 30 minutes", isCorrect:true },{ order:2, text:"Tu as commandé de la nourriture occidentale par erreur", isCorrect:false },{ order:3, text:"Tu as raccroché sans confirmer", isCorrect:false }] },
        { id: "t-hy-1-3", order: 3, instruction: "Demande un réveil (モーニングコール) pour 7h00",
          aiContext: "L'utilisateur demande un réveil téléphonique pour 7h. Note l'heure et confirme le service.",
          choices: [{ order:1, text:"Réveil confirmé pour 7h00", isCorrect:true },{ order:2, text:"Tu as demandé 7h mais l'hôtel a noté 17h", isCorrect:false },{ order:3, text:"Tu n'as pas demandé de réveil", isCorrect:false }] },
      ],
    },
    // ── Thème 3 : Quotidien ─────────────────────────────────────────────────────
    {
      id: "quest-7eleven-1", poiId: "7eleven-shinjuku", order: 1, xp: 45,
      title: "Café et snacks au 7-Eleven",
      description: "Commande un café fraîchement torréfié et des snacks japonais.",
      tasks: [
        { id: "t-sev-1-1", order: 1, instruction: "Demande où se trouvent les onigiri au saumon",
          aiContext: "L'utilisateur cherche les onigiri au saumon (さけおにぎり). Indique-lui le réfrigérateur au fond à gauche.",
          choices: [{ order:1, text:"Tu as trouvé les onigiri au saumon", isCorrect:true },{ order:2, text:"Tu as pris du thon mayo par erreur", isCorrect:false },{ order:3, text:"L'employé n'a pas compris ta demande", isCorrect:false }] },
        { id: "t-sev-1-2", order: 2, instruction: "Commande un café taille M (セブンカフェ) à la machine",
          aiContext: "L'utilisateur veut un café セブンカフェ taille M (100 yens). Explique-lui comment utiliser la machine automatique.",
          choices: [{ order:1, text:"Tu as commandé et payé ton café M correctement", isCorrect:true },{ order:2, text:"Tu as pris un café trop grand", isCorrect:false },{ order:3, text:"Tu n'as pas compris la machine", isCorrect:false }] },
        { id: "t-sev-1-3", order: 3, instruction: "Demande si les onigiri peuvent être chauffés (温めますか？)",
          aiContext: "L'utilisateur demande si on peut réchauffer son onigiri au micro-ondes. Oui, le micro-ondes est libre-service au fond du magasin.",
          choices: [{ order:1, text:"L'employé t'a montré le micro-ondes en libre-service", isCorrect:true },{ order:2, text:"Tu as mangé l'onigiri froid", isCorrect:false },{ order:3, text:"L'employé a réchauffé pour toi à la caisse", isCorrect:false }] },
      ],
    },
    {
      id: "quest-familymart-1", poiId: "familymart-shibuya", order: 1, xp: 45,
      title: "Le bento du midi",
      description: "Choisis et achète un bento, paie et redemande des baguettes.",
      tasks: [
        { id: "t-fm-1-1", order: 1, instruction: "Demande qu'est-ce que c'est 'ファミチキ'",
          aiContext: "L'utilisateur demande ce qu'est le ファミチキ. Explique que c'est le poulet frit signature de FamilyMart, croustillant et juteux, très populaire.",
          choices: [{ order:1, text:"Tu sais maintenant ce qu'est le ファミチキ", isCorrect:true },{ order:2, text:"Tu as confondu avec un onigiri", isCorrect:false },{ order:3, text:"Tu n'as pas compris l'explication", isCorrect:false }] },
        { id: "t-fm-1-2", order: 2, instruction: "Achète un bento et un ファミチキ",
          aiContext: "L'utilisateur commande un bento (弁当) et un ファミチキ. Total environ 600 yens. Demande s'il veut du ketchup ou de la sauce.",
          choices: [{ order:1, text:"Tu as acheté le bento et le ファミチキ", isCorrect:true },{ order:2, text:"Tu as oublié le ファミチキ", isCorrect:false },{ order:3, text:"Tu as pris le mauvais bento", isCorrect:false }] },
        { id: "t-fm-1-3", order: 3, instruction: "Demande des baguettes (箸) et un sac plastique",
          aiContext: "L'utilisateur demande des 箸 (hashi/baguettes) et un 袋 (fukuro/sac). Rappelle-lui que le sac coûte 3 yens depuis la loi de 2020.",
          choices: [{ order:1, text:"Tu as obtenu tes baguettes et sac (3¥)", isCorrect:true },{ order:2, text:"Tu as oublié de demander les baguettes", isCorrect:false },{ order:3, text:"Tu pensais que le sac était gratuit", isCorrect:false }] },
      ],
    },
    {
      id: "quest-lawson-1", poiId: "lawson-harajuku", order: 1, xp: 45,
      title: "Les desserts du Lawson",
      description: "Découvre les fameux desserts Uchi Café de Lawson.",
      tasks: [
        { id: "t-law-1-1", order: 1, instruction: "Demande lequel des desserts est le plus populaire",
          aiContext: "L'utilisateur demande le dessert le plus populaire. Recommande le ロールケーキ (gâteau roulé) ou le プレミアムロールケーキ, spécialité historique de Lawson.",
          choices: [{ order:1, text:"L'employé t'a recommandé le ロールケーキ", isCorrect:true },{ order:2, text:"Il t'a recommandé un onigiri", isCorrect:false },{ order:3, text:"Il n'avait pas d'avis", isCorrect:false }] },
        { id: "t-law-1-2", order: 2, instruction: "Achète le dessert recommandé et un lait au café",
          aiContext: "L'utilisateur achète le gâteau et un カフェラテ (cafe latte, en bouteille au réfrigérateur). Total ~380 yens.",
          choices: [{ order:1, text:"Achat réussi : dessert + lait café", isCorrect:true },{ order:2, text:"Tu as pris un thé au lieu du lait café", isCorrect:false },{ order:3, text:"Tu as oublié de prendre le dessert", isCorrect:false }] },
        { id: "t-law-1-3", order: 3, instruction: "Demande si la carte Ponta est acceptée",
          aiContext: "L'utilisateur demande si la carte Ponta (ポンタカード, programme fidélité de Lawson) est acceptée. Oui, et si il n'en a pas, propose de l'inscrire.",
          choices: [{ order:1, text:"Tu sais que Ponta est accepté chez Lawson", isCorrect:true },{ order:2, text:"L'employé a dit que Ponta n'existe plus", isCorrect:false },{ order:3, text:"Tu n'as pas entendu parler de Ponta", isCorrect:false }] },
      ],
    },
    {
      id: "quest-matsumoto-1", poiId: "matsumoto-kiyoshi-akiba", order: 1, xp: 55,
      title: "À la pharmacie",
      description: "Décris tes symptômes et achète le bon médicament.",
      tasks: [
        { id: "t-mat-1-1", order: 1, instruction: "Dis que tu as mal à la tête (頭が痛い) depuis ce matin",
          aiContext: "L'utilisateur a mal à la tête. Demande si c'est une douleur pulsatile, si il a de la fièvre, et propose de l'イブプロフェン ou du バファリン.",
          choices: [{ order:1, text:"La pharmacienne a compris tes symptômes", isCorrect:true },{ order:2, text:"Tu as dit que tu avais mal au ventre", isCorrect:false },{ order:3, text:"Tu n'as pas réussi à expliquer", isCorrect:false }] },
        { id: "t-mat-1-2", order: 2, instruction: "Demande le médicament recommandé et la posologie",
          aiContext: "La pharmacienne recommande バファリン (bufferin). Explique: 2 comprimés avec de l'eau, 3 fois par jour maximum. Demande s'il est allergique à l'aspirine.",
          choices: [{ order:1, text:"Tu as compris la posologie du バファリン", isCorrect:true },{ order:2, text:"Tu as pris le mauvais médicament", isCorrect:false },{ order:3, text:"Tu n'as pas compris la posologie", isCorrect:false }] },
        { id: "t-mat-1-3", order: 3, instruction: "Demande si c'est remboursable avec ta mutuelle étrangère",
          aiContext: "L'utilisateur demande si les médicaments japonais sont remboursables à l'étranger. Explique qu'il faut garder le reçu (領収書) pour sa mutuelle internationale, mais que la pharmacie ne gère pas directement le remboursement étranger.",
          choices: [{ order:1, text:"Tu gardes le reçu pour ta mutuelle", isCorrect:true },{ order:2, text:"La pharmacie a refusé de te donner un reçu", isCorrect:false },{ order:3, text:"Tu pensais que c'était remboursé directement", isCorrect:false }] },
      ],
    },
    {
      id: "quest-post-1", poiId: "tokyo-central-post", order: 1, xp: 50,
      title: "Envoyer un colis au Japon",
      description: "Envoie un colis en EMS vers la France depuis la poste centrale.",
      tasks: [
        { id: "t-post-1-1", order: 1, instruction: "Dis que tu veux envoyer un colis en France par EMS",
          aiContext: "L'utilisateur veut envoyer un colis par EMS (Express Mail Service). Demande-lui le poids approximatif et si c'est un cadeau ou un achat.",
          choices: [{ order:1, text:"L'agent a compris : colis EMS pour la France", isCorrect:true },{ order:2, text:"L'agent a proposé uniquement la poste ordinaire", isCorrect:false },{ order:3, text:"Tu as demandé DHL par erreur", isCorrect:false }] },
        { id: "t-post-1-2", order: 2, instruction: "Donne les détails du contenu (vêtements, aucun liquide)",
          aiContext: "L'utilisateur remplit la déclaration de douane (税関申告書). Demande le contenu, la valeur en yens, et si l'emballage est suffisant.",
          choices: [{ order:1, text:"La déclaration est remplie correctement", isCorrect:true },{ order:2, text:"Tu as oublié de déclarer la valeur", isCorrect:false },{ order:3, text:"Tu as mis des liquides dans le colis", isCorrect:false }] },
        { id: "t-post-1-3", order: 3, instruction: "Paye et demande le délai de livraison",
          aiContext: "L'EMS pour la France coûte ~2500¥ pour 500g. Délai : 3-5 jours ouvrables. L'agent te donne un numéro de suivi (追跡番号).",
          choices: [{ order:1, text:"Colis envoyé, tu as ton numéro de suivi", isCorrect:true },{ order:2, text:"Tu as choisi la poste lente (2-3 semaines)", isCorrect:false },{ order:3, text:"Tu as oublié de demander le numéro de suivi", isCorrect:false }] },
      ],
    },
    // ── Thème 4 : Manger & Boire ────────────────────────────────────────────────
    {
      id: "quest-starbucks-1", poiId: "starbucks-shibuya", order: 1, xp: 45,
      title: "Commander chez Starbucks",
      description: "Commande un café customisé au Starbucks du Scramble Crossing.",
      tasks: [
        { id: "t-sbx-1-1", order: 1, instruction: "Demande un Matcha Latte chaud taille Grande",
          aiContext: "L'utilisateur commande un 抹茶ラテ (matcha latte) chaud, taille グランデ (grande). Répète la commande et demande le prénom pour le gobelet.",
          choices: [{ order:1, text:"Commande passée, la barista a noté ton prénom", isCorrect:true },{ order:2, text:"Tu as commandé un thé noir par erreur", isCorrect:false },{ order:3, text:"Tu as oublié de préciser la taille", isCorrect:false }] },
        { id: "t-sbx-1-2", order: 2, instruction: "Demande à réduire le sucre (甘さ控えめで)",
          aiContext: "L'utilisateur veut moins de sucre. Demande-lui le niveau : 甘さ控えめ (réduit), ゼロ (sans sucre).",
          choices: [{ order:1, text:"La barista a bien noté la réduction de sucre", isCorrect:true },{ order:2, text:"Tu as oublié de préciser le sucre", isCorrect:false },{ order:3, text:"Tu as demandé encore plus de sucre", isCorrect:false }] },
        { id: "t-sbx-1-3", order: 3, instruction: "Demande si tu peux t'asseoir au balcon avec vue sur le Scramble",
          aiContext: "L'utilisateur veut s'asseoir au balcon vue sur le carrefour. Explique que le balcon est au 2ème étage, mais souvent complet — il faut attendre une place.",
          choices: [{ order:1, text:"Tu sais que le balcon est au 2ème étage et souvent plein", isCorrect:true },{ order:2, text:"La barista a dit que le balcon n'existait pas", isCorrect:false },{ order:3, text:"Tu as trouvé une place sans demander", isCorrect:false }] },
      ],
    },
    {
      id: "quest-mcdo-1", poiId: "mcdonalds-shibuya", order: 1, xp: 40,
      title: "Commander au McDonald's japonais",
      description: "Découvre les spécialités japonaises du MacDo et passe ta commande.",
      tasks: [
        { id: "t-mc-1-1", order: 1, instruction: "Demande ce qu'il y a de typiquement japonais dans le menu",
          aiContext: "L'utilisateur demande les spécialités japonaises. Parle du テリヤキバーガー (teriyaki burger) et du 月見バーガー (tsukimi burger, saisonnier avec œuf).",
          choices: [{ order:1, text:"Tu connais maintenant le テリヤキ et 月見バーガー", isCorrect:true },{ order:2, text:"La caissière a dit que le menu était identique à la France", isCorrect:false },{ order:3, text:"Tu as commandé sans poser de questions", isCorrect:false }] },
        { id: "t-mc-1-2", order: 2, instruction: "Commande un テリヤキバーガー en menu avec frites M",
          aiContext: "L'utilisateur commande un テリヤキバーガー en menu (セット) avec フライドポテトM et une boisson. Total ~800 yens.",
          choices: [{ order:1, text:"Commande passée : テリヤキ set M", isCorrect:true },{ order:2, text:"Tu as oublié de préciser M pour les frites", isCorrect:false },{ order:3, text:"Tu as commandé en anglais", isCorrect:false }] },
        { id: "t-mc-1-3", order: 3, instruction: "Paye sans contact (タッチ決済) et demande des serviettes",
          aiContext: "L'utilisateur paie sans contact (Suica, Apple Pay) et demande des ナプキン (serviettes). Donnes-en quelques-unes avec le plateau.",
          choices: [{ order:1, text:"Paiement sans contact réussi, tu as tes serviettes", isCorrect:true },{ order:2, text:"Tu as payé en espèces finalement", isCorrect:false },{ order:3, text:"Tu as oublié les serviettes", isCorrect:false }] },
      ],
    },
    {
      id: "quest-asahi-1", poiId: "asahi-super-dry-hall", order: 1, xp: 60,
      title: "Soirée à l'Asahi Super Dry Hall",
      description: "Commande des bières et des petites assiettes avec vue sur la Skytree.",
      tasks: [
        { id: "t-ash-1-1", order: 1, instruction: "Demande une table avec vue sur la Skytree pour 2 personnes",
          aiContext: "L'utilisateur veut une table avec vue sur le Tokyo Skytree. Propose-lui une table côté fenêtre si disponible, ou explique le temps d'attente.",
          choices: [{ order:1, text:"Tu as une table avec vue sur la Skytree", isCorrect:true },{ order:2, text:"Toutes les tables avec vue étaient prises", isCorrect:false },{ order:3, text:"Tu as demandé une table intérieure", isCorrect:false }] },
        { id: "t-ash-1-2", order: 2, instruction: "Commande 2 bières pression Asahi Super Dry",
          aiContext: "L'utilisateur commande 2 生ビール (bières pression) Asahi Super Dry. Demande si il veut aussi des 枝豆 (edamame) ou 唐揚げ (karaage).",
          choices: [{ order:1, text:"2 bières commandées, avec edamame en plus", isCorrect:true },{ order:2, text:"Tu n'as commandé qu'une seule bière", isCorrect:false },{ order:3, text:"Tu as commandé du vin", isCorrect:false }] },
        { id: "t-ash-1-3", order: 3, instruction: "Demande l'addition (お会計をお願いします)",
          aiContext: "L'utilisateur demande l'addition. Total environ 2600 yens pour 2 bières et edamame. Demande si le paiement est en espèces ou carte.",
          choices: [{ order:1, text:"L'addition est réglée correctement", isCorrect:true },{ order:2, text:"Tu as oublié de demander l'addition", isCorrect:false },{ order:3, text:"Tu as laissé l'autre payer", isCorrect:false }] },
      ],
    },
    // ── Thème 5 : Shopping ──────────────────────────────────────────────────────
    {
      id: "quest-loft-1", poiId: "loft-shibuya", order: 1, xp: 50,
      title: "Trouver un cadeau au Loft",
      description: "Cherche un cadeau original au Loft Shibuya et fais-le emballer.",
      tasks: [
        { id: "t-lof-1-1", order: 1, instruction: "Demande le rayon carnets et papeterie (文房具)",
          aiContext: "L'utilisateur cherche la papeterie (文房具). Indique-lui le 3ème étage, rayon notebooks et stylos.",
          choices: [{ order:1, text:"L'employé t'a indiqué le 3ème étage", isCorrect:true },{ order:2, text:"Tu as été envoyé au mauvais étage", isCorrect:false },{ order:3, text:"Tu n'as pas su demander le rayon", isCorrect:false }] },
        { id: "t-lof-1-2", order: 2, instruction: "Demande si le carnet peut être personnalisé (名入れ)",
          aiContext: "L'utilisateur demande si on peut graver ou imprimer un prénom sur le carnet (名入れサービス). Ce service est disponible moyennant 500¥ et un délai de 30 minutes.",
          choices: [{ order:1, text:"Tu sais que la personnalisation est possible pour 500¥", isCorrect:true },{ order:2, text:"L'employé a dit que ce service n'existait pas", isCorrect:false },{ order:3, text:"Tu as acheté le carnet sans personnalisation", isCorrect:false }] },
        { id: "t-lof-1-3", order: 3, instruction: "Demande un emballage cadeau (ラッピング)",
          aiContext: "L'utilisateur demande un ラッピング (emballage cadeau). C'est gratuit chez Loft pour les achats. Demande s'il préfère les rubans ou du papier de couleur.",
          choices: [{ order:1, text:"Le cadeau est joliment emballé, c'était gratuit", isCorrect:true },{ order:2, text:"L'emballage était payant (200¥)", isCorrect:false },{ order:3, text:"Tu as renoncé à l'emballage", isCorrect:false }] },
      ],
    },
    {
      id: "quest-109-1", poiId: "shibuya-109", order: 1, xp: 55,
      title: "Shopping mode au SHIBUYA109",
      description: "Essaie une tenue tendance et découvre les tailles japonaises.",
      tasks: [
        { id: "t-109-1-1", order: 1, instruction: "Demande quelle est la taille japonaise pour un 38 européen",
          aiContext: "L'utilisateur demande la correspondance des tailles. En Japan : S=36-38, M=38-40, L=40-42 pour les femmes. Guide-le vers la bonne taille.",
          choices: [{ order:1, text:"Tu sais que tu fais du M en taille japonaise", isCorrect:true },{ order:2, text:"Tu as pris trop grand", isCorrect:false },{ order:3, text:"Tu n'as pas compris les tailles", isCorrect:false }] },
        { id: "t-109-1-2", order: 2, instruction: "Demande si tu peux essayer la veste (試着できますか？)",
          aiContext: "L'utilisateur demande à essayer la veste. Dis oui, guide-le vers la cabine d'essayage (試着室). Demande quelle taille il prend.",
          choices: [{ order:1, text:"Tu as essayé la veste en cabine", isCorrect:true },{ order:2, text:"L'essayage n'était pas autorisé", isCorrect:false },{ order:3, text:"Tu as acheté sans essayer", isCorrect:false }] },
        { id: "t-109-1-3", order: 3, instruction: "Dis que c'est un peu trop large et demande la taille en dessous",
          aiContext: "La veste est trop grande. L'utilisateur demande la taille en dessous (小さいサイズ). Vérifie le stock et apporte le S si disponible.",
          choices: [{ order:1, text:"La vendeuse a apporté la bonne taille", isCorrect:true },{ order:2, text:"Le S n'était plus en stock", isCorrect:false },{ order:3, text:"Tu as gardé la taille trop grande", isCorrect:false }] },
      ],
    },
    {
      id: "quest-donki-1", poiId: "donquijote-shibuya", order: 1, xp: 50,
      title: "Chasse aux bonnes affaires chez Donki",
      description: "Navigue dans le labyrinthe de Don Quijote et compare les prix.",
      tasks: [
        { id: "t-dk-1-1", order: 1, instruction: "Demande où est le rayon cosmétiques coréens",
          aiContext: "L'utilisateur cherche les cosmétiques coréens (韓国コスメ). Indique-lui le 2ème étage, rayon beauté côté droit.",
          choices: [{ order:1, text:"Tu as trouvé les cosmétiques coréens au 2ème", isCorrect:true },{ order:2, text:"Tu es allé au rayon électronique par erreur", isCorrect:false },{ order:3, text:"L'employé ne savait pas", isCorrect:false }] },
        { id: "t-dk-1-2", order: 2, instruction: "Demande si la détaxe (免税) est disponible pour les touristes",
          aiContext: "L'utilisateur demande la détaxe (免税 / Tax Free). Oui, à partir de 5000¥ d'achats. Il faut présenter le passeport au comptoir Tax Free.",
          choices: [{ order:1, text:"La détaxe est dispo à partir de 5000¥ sur présentation du passeport", isCorrect:true },{ order:2, text:"Donki n'accepte pas la détaxe", isCorrect:false },{ order:3, text:"Tu n'avais pas ton passeport", isCorrect:false }] },
        { id: "t-dk-1-3", order: 3, instruction: "Paye et demande de pouvoir payer en yen et en carte",
          aiContext: "L'utilisateur veut payer en carte. Accepté. Précise que Visa, Mastercard et AMEX sont acceptés. Paiement sans contact possible.",
          choices: [{ order:1, text:"Paiement par carte accepté, sans contact possible", isCorrect:true },{ order:2, text:"Donki n'acceptait que les espèces", isCorrect:false },{ order:3, text:"Tu as payé uniquement en espèces", isCorrect:false }] },
      ],
    },
    {
      id: "quest-yodobashi-1", poiId: "yodobashi-akiba", order: 1, xp: 60,
      title: "Acheter un appareil photo",
      description: "Compare deux appareils photo et achète le meilleur pour ton budget.",
      tasks: [
        { id: "t-yod-1-1", order: 1, instruction: "Dis que tu cherches un appareil photo compact sous 50 000 yens",
          aiContext: "L'utilisateur cherche un appareil photo compact (コンパクトカメラ) sous 50 000¥. Propose-lui 2-3 modèles Sony, Canon ou Ricoh.",
          choices: [{ order:1, text:"L'expert t'a proposé 2-3 modèles dans ton budget", isCorrect:true },{ order:2, text:"Tous les modèles dépassaient ton budget", isCorrect:false },{ order:3, text:"Tu as été envoyé au rayon téléphone", isCorrect:false }] },
        { id: "t-yod-1-2", order: 2, instruction: "Demande la différence entre les deux modèles proposés",
          aiContext: "L'utilisateur compare 2 modèles. Explique la différence (zoom optique, taille du capteur, autonomie de batterie, poids).",
          choices: [{ order:1, text:"Tu comprends les différences et as fait ton choix", isCorrect:true },{ order:2, text:"Les explications étaient trop techniques", isCorrect:false },{ order:3, text:"Tu n'as pas osé demander les différences", isCorrect:false }] },
        { id: "t-yod-1-3", order: 3, instruction: "Demande la carte de garantie et la détaxe",
          aiContext: "L'utilisateur demande la garantie internationale (国際保証) et la Tax Free. Garantie: 1 an mondiale. Tax Free si passeport et achat > 5000¥.",
          choices: [{ order:1, text:"Garantie internationale et détaxe obtenues", isCorrect:true },{ order:2, text:"La garantie n'était valable qu'au Japon", isCorrect:false },{ order:3, text:"Tu as oublié la détaxe", isCorrect:false }] },
      ],
    },
    {
      id: "quest-lumine-1", poiId: "lumine-est-shinjuku", order: 1, xp: 45,
      title: "Trouver son chemin dans Lumine",
      description: "Navigue dans Lumine Est et trouve le restaurant qui te correspond.",
      tasks: [
        { id: "t-lum-1-1", order: 1, instruction: "Demande à quel étage se trouvent les restaurants",
          aiContext: "L'utilisateur cherche le restaurant. Indique que les restaurants sont aux 7ème et 8ème étages, avec des cuisines japonaise, italienne et asiatique.",
          choices: [{ order:1, text:"Tu sais que les restos sont aux 7ème et 8ème étages", isCorrect:true },{ order:2, text:"Tu as cherché au 3ème étage", isCorrect:false },{ order:3, text:"L'hôtesse t'a envoyé dans les boutiques", isCorrect:false }] },
        { id: "t-lum-1-2", order: 2, instruction: "Demande si un restaurant sert du ramen végétarien",
          aiContext: "L'utilisateur cherche un ramen végétarien (ベジタリアン). Signale qu'il y a un restaurant spécialisé au 8ème qui propose du ramen aux champignons sans viande.",
          choices: [{ order:1, text:"Tu as trouvé un ramen végé au 8ème étage", isCorrect:true },{ order:2, text:"Aucun restaurant végé n'était disponible", isCorrect:false },{ order:3, text:"Tu as commandé un ramen avec viande", isCorrect:false }] },
        { id: "t-lum-1-3", order: 3, instruction: "Demande comment rejoindre la gare JR Shinjuku directement",
          aiContext: "L'utilisateur veut rejoindre JR Shinjuku directement depuis Lumine. Explique qu'il y a une connexion directe au niveau B1 sans sortir à l'extérieur.",
          choices: [{ order:1, text:"Tu sais qu'il y a une connexion directe au B1", isCorrect:true },{ order:2, text:"L'hôtesse t'a dit de sortir dehors", isCorrect:false },{ order:3, text:"Tu es sorti par la mauvaise sortie", isCorrect:false }] },
      ],
    },
    // ── Thème 6 : Découvrir Tokyo ───────────────────────────────────────────────
    {
      id: "quest-skytree-1", poiId: "tokyo-skytree", order: 1, xp: 65,
      title: "Monter au Tokyo Skytree",
      description: "Achète ton billet et monte aux 350m au-dessus de Tokyo.",
      tasks: [
        { id: "t-sky-1-1", order: 1, instruction: "Demande le prix du billet pour la plateforme à 350m",
          aiContext: "L'utilisateur demande le tarif. Plateforme Tembo Deck (350m) : 2100¥ adulte. Tembo Galleria (450m) : 1000¥ en plus. Demande s'il veut les deux.",
          choices: [{ order:1, text:"Tu sais : Tembo Deck 2100¥, Galleria 1000¥ en plus", isCorrect:true },{ order:2, text:"Tu pensais que l'entrée était gratuite", isCorrect:false },{ order:3, text:"Tu as confondu les deux niveaux d'observation", isCorrect:false }] },
        { id: "t-sky-1-2", order: 2, instruction: "Achète le billet et demande si la vue sur le Fuji est possible aujourd'hui",
          aiContext: "L'utilisateur demande si on peut voir le Mont Fuji. Explique que cela dépend de la météo et de la visibilité. Par temps clair (晴れた日), c'est visible à l'ouest.",
          choices: [{ order:1, text:"Tu sais que le Fuji se voit par temps clair", isCorrect:true },{ order:2, text:"Le guide a dit que le Fuji n'est jamais visible", isCorrect:false },{ order:3, text:"Tu n'as pas demandé pour le Fuji", isCorrect:false }] },
        { id: "t-sky-1-3", order: 3, instruction: "En haut, demande au guide ce que signifie le chiffre 634",
          aiContext: "L'utilisateur demande pourquoi la Skytree mesure 634m. Explique : 634 se lit 'Musashi' (む・さ・し) en japonais, ancien nom de la région de Tokyo.",
          choices: [{ order:1, text:"Tu sais maintenant que 634 = Musashi (む・さ・し)", isCorrect:true },{ order:2, text:"Le guide a dit que c'était juste un nombre aléatoire", isCorrect:false },{ order:3, text:"Tu n'as pas pensé à poser la question", isCorrect:false }] },
      ],
    },
    {
      id: "quest-tokyotower-1", poiId: "tokyo-tower", order: 1, xp: 60,
      title: "La Tour de Tokyo",
      description: "Visite la tour emblématique inspirée de la Tour Eiffel.",
      tasks: [
        { id: "t-tt-1-1", order: 1, instruction: "Demande quelle est la différence entre la Tokyo Tower et la Skytree",
          aiContext: "L'utilisateur compare les deux tours. Explique : Tokyo Tower (333m, 1958, orange et blanc, structure acier), Skytree (634m, 2012, moderne). Les deux ont des observatoires mais Tokyo Tower est plus historique.",
          choices: [{ order:1, text:"Tu comprends la différence historique et architecturale", isCorrect:true },{ order:2, text:"Le guide a dit qu'elles étaient identiques", isCorrect:false },{ order:3, text:"Tu as confondu les deux tours", isCorrect:false }] },
        { id: "t-tt-1-2", order: 2, instruction: "Achète un billet pour le Main Deck (150m) et demande l'heure de fermeture",
          aiContext: "L'utilisateur achète un billet Main Deck (1200¥). Fermeture à 23h. Le Top Deck (250m) nécessite une réservation supplémentaire (700¥).",
          choices: [{ order:1, text:"Billet acheté, fermeture à 23h", isCorrect:true },{ order:2, text:"Tu as acheté le billet Top Deck par erreur", isCorrect:false },{ order:3, text:"Tu pensais que c'était fermé à 18h", isCorrect:false }] },
        { id: "t-tt-1-3", order: 3, instruction: "Demande comment la tour est éclairée (illumination) le soir",
          aiContext: "L'utilisateur demande l'illumination nocturne. Explique qu'il y a deux modes : orange 'Landmark Light' (hiver) et blanc 'Diamond Veil' (été). L'heure d'allumage dépend de la saison.",
          choices: [{ order:1, text:"Tu connais les deux modes d'illumination de la tour", isCorrect:true },{ order:2, text:"Le guide a dit que l'illumination était constante", isCorrect:false },{ order:3, text:"Tu n'as pas demandé pour les lumières", isCorrect:false }] },
      ],
    },
    {
      id: "quest-meiji-1", poiId: "meiji-jingu", order: 1, xp: 55,
      title: "Se recueillir au Meiji Jingū",
      description: "Apprends les codes du sanctuaire shinto et prie correctement.",
      tasks: [
        { id: "t-mj-1-1", order: 1, instruction: "Demande comment se purifier à la fontaine (手水舎)",
          aiContext: "L'utilisateur demande comment utiliser la 手水舎 (chōzuya). Explique : 1) prendre la louche de la main droite, rincer la gauche ; 2) prendre la louche de la main gauche, rincer la droite ; 3) verser de l'eau dans le creux de la main gauche pour rincer la bouche (sans avaler) ; 4) laver le manche en inclinant la louche.",
          choices: [{ order:1, text:"Tu connais les 4 étapes de la purification", isCorrect:true },{ order:2, text:"Tu as bu directement à la fontaine", isCorrect:false },{ order:3, text:"Tu as sauté la purification", isCorrect:false }] },
        { id: "t-mj-1-2", order: 2, instruction: "Demande comment prier correctement (二拝二拍手一拝)",
          aiContext: "La miko explique la méthode de prière : jeter une pièce (5¥ porte-bonheur), deux profondes inclinaisons, deux claquements de mains, un vœu silencieux, une dernière inclinaison.",
          choices: [{ order:1, text:"Tu maîtrises la méthode 二拝二拍手一拝", isCorrect:true },{ order:2, text:"Tu as fait les gestes dans le mauvais ordre", isCorrect:false },{ order:3, text:"Tu as fait une seule inclinaison", isCorrect:false }] },
        { id: "t-mj-1-3", order: 3, instruction: "Achète un omamori (お守り) pour la réussite scolaire",
          aiContext: "L'utilisateur veut un お守り pour la réussite aux examens (学業成就). Il coûte 800¥. Explique que le contenu est sacré, on ne l'ouvre jamais.",
          choices: [{ order:1, text:"Tu as l'お守り学業成就 et tu sais ne jamais l'ouvrir", isCorrect:true },{ order:2, text:"Tu as ouvert l'お守り par curiosité", isCorrect:false },{ order:3, text:"Tu as acheté le mauvais お守り", isCorrect:false }] },
      ],
    },
    {
      id: "quest-sensoji-1", poiId: "sensoji", order: 1, xp: 60,
      title: "Visite du Sensō-ji",
      description: "Explore le plus vieux temple de Tokyo et tire ton omikuji.",
      tasks: [
        { id: "t-sen-1-1", order: 1, instruction: "Demande l'histoire de la porte Kaminarimon (雷門)",
          aiContext: "L'utilisateur demande l'histoire de la 雷門 (Thunder Gate). Explique : fondée en 942, reconstruite en 1960 grâce au don du fondateur de Panasonic. La grande lanterne rouge pèse 670kg.",
          choices: [{ order:1, text:"Tu sais l'histoire de la 雷門 et de sa lanterne de 670kg", isCorrect:true },{ order:2, text:"Le prêtre a dit que la porte datait de 1960", isCorrect:false },{ order:3, text:"Tu n'as pas demandé l'histoire", isCorrect:false }] },
        { id: "t-sen-1-2", order: 2, instruction: "Tire un omikuji (おみくじ) et demande ce que signifie 大吉",
          aiContext: "L'utilisateur tire un おみくじ. Si c'est 大吉 (daikichi), explique que c'est la meilleure fortune, signifiant grand bonheur. Les autres : 吉, 中吉, 小吉, 末吉, 凶. Les mauvais omikuji se nouent dans le temple.",
          choices: [{ order:1, text:"Tu sais que 大吉 est la meilleure chance", isCorrect:true },{ order:2, text:"Tu pensais que 凶 était positif", isCorrect:false },{ order:3, text:"Tu n'as pas voulu tirer l'omikuji", isCorrect:false }] },
        { id: "t-sen-1-3", order: 3, instruction: "Achète un souvenir dans la Nakamise-dori (仲見世通り)",
          aiContext: "L'utilisateur veut acheter un souvenir dans la 仲見世通り. Recommande les 人形焼き (ningyo yaki, petits gâteaux en forme de personnages) ou les 雷おこし (kaminari okoshi, biscuits soufflés au riz) comme spécialité d'Asakusa.",
          choices: [{ order:1, text:"Tu as acheté une spécialité d'Asakusa", isCorrect:true },{ order:2, text:"Tu as acheté une Kity souvenirs banale", isCorrect:false },{ order:3, text:"Tu es reparti sans souvenir", isCorrect:false }] },
      ],
    },
    {
      id: "quest-museum-1", poiId: "tokyo-national-museum", order: 1, xp: 55,
      title: "Au Musée National de Tokyo",
      description: "Découvre les trésors de l'art japonais au plus grand musée du pays.",
      tasks: [
        { id: "t-mus-1-1", order: 1, instruction: "Demande quelle est la pièce la plus précieuse du musée",
          aiContext: "L'utilisateur demande la pièce la plus précieuse. Parle du 埴輪 (haniwa — statuettes funéraires japonaises du Ve-VIIe siècle) ou de la collection de katana (刀) du Honkan. Le musée possède 110 000 pièces.",
          choices: [{ order:1, text:"Tu connais maintenant les pièces majeures du musée", isCorrect:true },{ order:2, text:"Le conservateur a refusé de te répondre", isCorrect:false },{ order:3, text:"Tu as demandé pour les peintures occidentales", isCorrect:false }] },
        { id: "t-mus-1-2", order: 2, instruction: "Demande si les explications sont disponibles en français",
          aiContext: "L'utilisateur veut des explications en français. Il existe un audioguide (音声ガイド, 650¥) en plusieurs langues dont le français. Certains panneaux ont aussi des résumés en anglais.",
          choices: [{ order:1, text:"Tu as loué l'audioguide en français pour 650¥", isCorrect:true },{ order:2, text:"Aucun support en français n'était disponible", isCorrect:false },{ order:3, text:"Tu as visité sans aide linguistique", isCorrect:false }] },
        { id: "t-mus-1-3", order: 3, instruction: "Demande l'heure de fermeture et s'il y a un café",
          aiContext: "L'utilisateur demande l'heure de fermeture (17h, entrée jusqu'à 16h30, fermé lundi). Il y a un café-restaurant Honkan Tea House dans le parc. Le parc d'Ueno en face a aussi des options.",
          choices: [{ order:1, text:"Tu sais : fermeture à 17h, café dans le parc", isCorrect:true },{ order:2, text:"Tu pensais que le musée fermait à 20h", isCorrect:false },{ order:3, text:"Tu as raté la dernière entrée", isCorrect:false }] },
      ],
    },
    {
      id: "quest-theater-1", poiId: "tokyo-metro-theatre", order: 1, xp: 55,
      title: "Au Théâtre Métropolitain",
      description: "Achète des billets pour un spectacle et découvre la culture musicale tokyoïte.",
      tasks: [
        { id: "t-the-1-1", order: 1, instruction: "Demande ce qui est à l'affiche ce soir",
          aiContext: "L'utilisateur demande le programme. Ce soir, l'Orchestre Philharmonique de Tokyo joue Beethoven (交響曲第9番, la 9ème symphonie). Les billets vont de 3500¥ à 15 000¥.",
          choices: [{ order:1, text:"Tu sais ce soir : orchestre philharmonique, Beethoven 9ème", isCorrect:true },{ order:2, text:"C'était une pièce de théâtre kabuki", isCorrect:false },{ order:3, text:"Tu n'as pas compris le programme", isCorrect:false }] },
        { id: "t-the-1-2", order: 2, instruction: "Achète 2 billets en catégorie B (5000¥ chacun)",
          aiContext: "L'utilisateur achète 2 billets à 5000¥ chacun. Demande si paiement en espèces ou carte. Donne les sièges et rappelle l'heure d'ouverture des portes (30 minutes avant).",
          choices: [{ order:1, text:"2 billets achetés, portes à 18h30 pour 19h", isCorrect:true },{ order:2, text:"Tu as pris des billets en catégorie A trop chers", isCorrect:false },{ order:3, text:"Tu as oublié de demander l'heure des portes", isCorrect:false }] },
        { id: "t-the-1-3", order: 3, instruction: "Demande où laisser ton manteau (vestiaire / クローク)",
          aiContext: "L'utilisateur demande le vestiaire (クローク). Il est au sous-sol B1. Gratuit pour les manteaux, le sac à dos coûte 200¥. Le cloakroom ferme après le spectacle.",
          choices: [{ order:1, text:"Tu as trouvé le vestiaire au B1, gratuit pour manteau", isCorrect:true },{ order:2, text:"Tu ne savais pas qu'il y avait un vestiaire", isCorrect:false },{ order:3, text:"Tu es entré dans la salle avec ton manteau", isCorrect:false }] },
      ],
    },
    {
      id: "quest-karaoke-1", poiId: "big-echo-kabukicho", order: 1, xp: 65,
      title: "Nuit karaoké à Kabukichō",
      description: "Réserve une salle, chante en japonais et profite du free-time.",
      tasks: [
        { id: "t-bec-1-1", order: 1, instruction: "Réserve une salle pour 3 personnes pendant 2 heures",
          aiContext: "L'utilisateur réserve une salle karaoké pour 3 personnes (3名様), 2 heures. Le staff propose le free-time (飲み放題セット, boissons incluses) pour ~2000¥/personne. Demande si ça l'intéresse.",
          choices: [{ order:1, text:"Salle réservée pour 3 personnes avec free-time", isCorrect:true },{ order:2, text:"Tu n'as réservé que pour 1h", isCorrect:false },{ order:3, text:"Tu as refusé le free-time", isCorrect:false }] },
        { id: "t-bec-1-2", order: 2, instruction: "Demande comment chercher une chanson japonaise par titre",
          aiContext: "L'utilisateur demande comment chercher une chanson. Explique la tablette tactile : entrer le titre en hiragana ou katakana, ou utiliser la lecture roma (romaji). Les J-Pop sont classées par artiste.",
          choices: [{ order:1, text:"Tu sais chercher une chanson par hiragana ou romaji", isCorrect:true },{ order:2, text:"Tu n'as pas compris la tablette", isCorrect:false },{ order:3, text:"Tu n'as pu chanter que des chansons anglaises", isCorrect:false }] },
        { id: "t-bec-1-3", order: 3, instruction: "À la fin, demande l'addition et si tu peux prolonger d'une heure",
          aiContext: "L'utilisateur veut prolonger d'une heure. Vérifie la disponibilité et ajoute 800¥/personne pour l'heure supplémentaire. Accepte si la salle est libre.",
          choices: [{ order:1, text:"Tu as prolongé d'1h pour 800¥/personne", isCorrect:true },{ order:2, text:"La salle était déjà réservée après vous", isCorrect:false },{ order:3, text:"Tu as quitté la salle exactement à l'heure", isCorrect:false }] },
      ],
    },
    {
      id: "quest-maidcafe-1", poiId: "at-home-cafe-akihabara", order: 1, xp: 70,
      title: "L'expérience maid café",
      description: "Découvre l'univers des maid cafés d'Akihabara et commande un plat magique.",
      tasks: [
        { id: "t-mca-1-1", order: 1, instruction: "Réponds à la maid qui te dit 'おかえりなさいませ'",
          aiContext: "L'utilisateur arrive et la maid l'accueille avec 'おかえりなさいませ, ご主人様！'. Il doit répondre correctement pour entrer dans le jeu de rôle.",
          choices: [{ order:1, text:"Tu as répondu 'ただいま' et tu es entré dans le jeu", isCorrect:true },{ order:2, text:"Tu as juste dit 'merci' en français", isCorrect:false },{ order:3, text:"Tu as brisé le jeu de rôle", isCorrect:false }] },
        { id: "t-mca-1-2", order: 2, instruction: "Commande un omurice (オムライス) avec décoration au ketchup",
          aiContext: "L'utilisateur commande un オムライス. La maid propose de dessiner un message ou un dessin sur l'omelette au ketchup. Elle vous apprendra une 'formule magique' pour que le plat soit 'moe moe kyun'.",
          choices: [{ order:1, text:"Tu as commandé l'omurice avec dessin et dit la formule", isCorrect:true },{ order:2, text:"Tu as commandé un plat sans décoration", isCorrect:false },{ order:3, text:"Tu as refusé de faire la formule magique", isCorrect:false }] },
        { id: "t-mca-1-3", order: 3, instruction: "Achète une photo Polaroid souvenir avec la maid",
          aiContext: "L'utilisateur veut une photo Polaroid avec la maid (チェキ, 800¥). La maid pose avec lui et signe le Polaroid. Les photos avec les maids sont soumises à des règles (pas de contact physique, demander l'autorisation).",
          choices: [{ order:1, text:"Tu as ton Polaroid signé, en respectant les règles", isCorrect:true },{ order:2, text:"La maid a refusé la photo", isCorrect:false },{ order:3, text:"Tu as essayé de toucher la maid sans permission", isCorrect:false }] },
      ],
    },
    {
      id: "quest-hospital-1", poiId: "keio-hospital", order: 1, xp: 70,
      title: "Consultation à l'hôpital Keio",
      description: "Décris tes symptômes en japonais et naviguer dans le système de santé.",
      tasks: [
        { id: "t-hos-1-1", order: 1, instruction: "Explique que tu as de la fièvre (38°) et mal à la gorge",
          aiContext: "L'utilisateur a 38° de fièvre (熱が38度あります) et mal à la gorge (喉が痛い). Demande depuis combien de temps et si il a d'autres symptômes.",
          choices: [{ order:1, text:"L'infirmière a compris tes symptômes précisément", isCorrect:true },{ order:2, text:"Tu n'as pas su exprimer la fièvre en japonais", isCorrect:false },{ order:3, text:"Tu as dit que tu avais mal au dos à la place", isCorrect:false }] },
        { id: "t-hos-1-2", order: 2, instruction: "Demande si tu as besoin d'une assurance médicale internationale",
          aiContext: "L'utilisateur demande comment fonctionne l'assurance à Keio. Explique : Keio accepte les touristes mais paiement direct requis (可能性あり). La caisse rembourse ensuite avec les papiers (領収書 + rapport médical). Un service d'interprétation est disponible.",
          choices: [{ order:1, text:"Tu comprends le processus de remboursement", isCorrect:true },{ order:2, text:"L'infirmière a dit que les étrangers n'étaient pas acceptés", isCorrect:false },{ order:3, text:"Tu pensais que c'était gratuit comme en France", isCorrect:false }] },
        { id: "t-hos-1-3", order: 3, instruction: "Demande une ordonnance (処方箋) à apporter à la pharmacie",
          aiContext: "Le médecin a diagnostiqué une angine (扁桃炎). Il donne une 処方箋 pour des antibiotiques. Explique que la pharmacie la plus proche est dans le bâtiment principal.",
          choices: [{ order:1, text:"Tu as ton ordonnance et sais où aller à la pharmacie", isCorrect:true },{ order:2, text:"Tu n'as pas compris que tu avais besoin d'une ordonnance", isCorrect:false },{ order:3, text:"Tu as acheté un médicament sans ordonnance", isCorrect:false }] },
      ],
    },
  ];

  for (const q of TOKYO_QUESTS) {
    const exists = await prisma.quest.findUnique({ where: { id: q.id } });
    if (!exists) {
      await prisma.quest.create({
        data: {
          id: q.id, poiId: q.poiId, title: q.title, description: q.description,
          order: q.order, xpReward: q.xp, isActive: true,
          tasks: {
            create: q.tasks.map(t => ({
              id: t.id, order: t.order, instruction: t.instruction, aiContext: t.aiContext,
              choices: { create: t.choices },
            })),
          },
        },
      });
    }
  }
  console.log("Tokyo quests seeded.");

  // ── Tokyo Lessons (batch 1: transport, hotel, quotidien, food) ────────────────

  const TOKYO_LESSONS_1 = [
    {
      poiId: "haneda-airport", title: "Bienvenue à l'aéroport Haneda", description: "Vocabulaire essentiel pour arriver et s'orienter à l'aéroport",
      steps: [
        {order:1,type:"INTRO",data:{word:"出発",kana:"しゅっぱつ",romaji:"shuppatsu",translation:"Départ",example:"Panneau 出発 = Departures à l'aérogare"}},
        {order:2,type:"INTRO",data:{word:"手荷物",kana:"てにもつ",romaji:"tenimotsu",translation:"Bagage à main",example:"Vérifier le poids de vos 手荷物 avant l'embarquement"}},
        {order:3,type:"PRONUNCIATION",data:{word:"搭乗口",kana:"とうじょうぐち",romaji:"tō·jō·gu·chi",translation:"Porte d'embarquement",hint:"4 syllabes: tō-jō-gu-chi, prononce chaque syllabe distinctement"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「入国審査」signifie 'contrôle d'embarquement'",isTrue:false,explanation:"入国審査 = contrôle d'immigration / passage des frontières. 搭乗 = embarquement.",word:"入国審査"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"L'agent vous demande 「目的は何ですか？」. Quelle est la bonne réponse si vous êtes touriste ?",choices:[{text:"観光です",subtext:"kankou desu",isCorrect:true},{text:"仕事です",subtext:"shigoto desu",isCorrect:false},{text:"何もないです",subtext:"nani mo nai desu",isCorrect:false}],explanation:"観光 = tourisme. 仕事 = travail. Répondez clairement à l'agent d'immigration !",translation:"C'est pour le tourisme."}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Haneda vs Narita",text:"Haneda (羽田空港) est l'aéroport historique de Tokyo, très central. Depuis 2010, il accueille les vols internationaux (Terminal 3). Accès en 30 min par le Tokyo Monorail ou la Keikyu Line. Narita est plus éloigné mais souvent moins cher.",vocab:[{word:"出発",kana:"しゅっぱつ",translation:"départ"},{word:"到着",kana:"とうちゃく",translation:"arrivée"},{word:"搭乗口",kana:"とうじょうぐち",translation:"porte d'embarquement"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"出発",right:"Départ"},{left:"到着",right:"Arrivée"},{left:"搭乗口",right:"Porte d'embarquement"},{left:"手荷物",right:"Bagage à main"}]}},
      ]
    },
    {
      poiId: "tokyo-station-shinkansen", title: "Le Shinkansen", description: "Maîtrise le vocabulaire du train à grande vitesse japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"新幹線",kana:"しんかんせん",romaji:"shinkansen",translation:"Train à grande vitesse",example:"Le réseau 新幹線 couvre tout le Japon de Hokkaido à Kagoshima"}},
        {order:2,type:"INTRO",data:{word:"指定席",kana:"していせき",romaji:"shiteiseki",translation:"Siège réservé",example:"Acheter un billet 指定席 à l'avance sur le site JR"}},
        {order:3,type:"PRONUNCIATION",data:{word:"新幹線",kana:"しんかんせん",romaji:"shin·kan·sen",translation:"Train à grande vitesse",hint:"3 syllabes régulières et égales: shin-kan-sen"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「自由席」signifie place réservée",isTrue:false,explanation:"自由席 = siège libre (sans réservation). Pour une place réservée : 指定席.",word:"自由席"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Le Nozomi relie Tokyo à Osaka en environ :",choices:[{text:"2h30",subtext:"le plus rapide",isCorrect:true},{text:"4 heures",subtext:"comme le Hikari",isCorrect:false},{text:"6 heures",subtext:"trop lent !",isCorrect:false}],explanation:"Le Nozomi (のぞみ) est le plus rapide : Tokyo-Osaka en ~2h15-2h30. Attention : non couvert par le JR Pass standard.",translation:"Environ 2h30"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Le Shinkansen, ponctualité légendaire",text:"Le Shinkansen (新幹線) a un retard moyen de moins d'une minute sur des millions de trajets. Il existe plusieurs types : のぞみ (le plus rapide), ひかり, こだま (s'arrête partout). Le JR Pass standard ne couvre pas le Nozomi.",vocab:[{word:"指定席",kana:"していせき",translation:"place réservée"},{word:"自由席",kana:"じゆうせき",translation:"place libre"},{word:"のぞみ",translation:"Nozomi (le plus rapide)"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"新幹線",right:"Bullet train"},{left:"指定席",right:"Place réservée"},{left:"自由席",right:"Place libre"},{left:"のぞみ",right:"Le plus rapide"}]}},
      ]
    },
    {
      poiId: "jr-shinjuku", title: "Naviguer à Shinjuku", description: "Maîtrise les correspondances et la carte IC dans la gare la plus fréquentée du monde",
      steps: [
        {order:1,type:"INTRO",data:{word:"改札口",kana:"かいさつぐち",romaji:"kaisatsuguchi",translation:"Portique de validation",example:"Passe la 改札口 en appuyant ta carte IC sur le lecteur"}},
        {order:2,type:"INTRO",data:{word:"乗り換え",kana:"のりかえ",romaji:"norikae",translation:"Correspondance",example:"Suis les panneaux 乗り換え pour changer de ligne sans sortir"}},
        {order:3,type:"PRONUNCIATION",data:{word:"乗り換え",kana:"のりかえ",romaji:"no·ri·ka·e",translation:"Correspondance",hint:"4 mores: no-ri-ka-e. L'accent est sur la 1ère syllabe."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"La carte Suica ne peut être utilisée que sur les lignes JR",isTrue:false,explanation:"Suica fonctionne sur quasi tous les transports de Tokyo : JR, métro Tokyo Metro, Toei, bus, et même dans beaucoup de konbinis et distributeurs.",word:"Suica"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux aller à Shibuya depuis Shinjuku. Quelle ligne prends-tu ?",choices:[{text:"山手線",subtext:"Yamanote Line",isCorrect:true},{text:"中央線",subtext:"Chūō Line",isCorrect:false},{text:"西武線",subtext:"Seibu Line",isCorrect:false}],explanation:"La 山手線 (Yamanote) fait le tour de Tokyo et relie Shinjuku à Shibuya en 5 min. La Chūō va vers l'ouest.",translation:"Ligne Yamanote"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Shinjuku, la gare la plus fréquentée du monde",text:"Shinjuku (新宿駅) accueille 3,5 millions de passagers par jour et possède plus de 200 sorties ! Les portiques à icône de couleur vous aident à vous repérer. Une app comme Google Maps ou Navitime facilite grandement la navigation.",vocab:[{word:"改札口",kana:"かいさつぐち",translation:"portique"},{word:"乗り換え",kana:"のりかえ",translation:"correspondance"},{word:"出口",kana:"でぐち",translation:"sortie"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"改札口",right:"Portique"},{left:"乗り換え",right:"Correspondance"},{left:"出口",right:"Sortie"},{left:"終点",right:"Terminus"}]}},
      ]
    },
    {
      poiId: "nine-hours-shinjuku", title: "Capsule hôtel", description: "Vocabulaire pour séjourner dans un capsule hôtel japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"チェックイン",kana:"ちぇっくいん",romaji:"chekkuin",translation:"Check-in",example:"Se présenter à la réception pour effectuer son チェックイン"}},
        {order:2,type:"INTRO",data:{word:"ロッカー",kana:"ろっかー",romaji:"rokkā",translation:"Casier / Locker",example:"Ranger ses affaires dans le ロッカー fourni à l'entrée"}},
        {order:3,type:"PRONUNCIATION",data:{word:"カプセル",kana:"かぷせる",romaji:"ka·pu·se·ru",translation:"Capsule",hint:"4 syllabes: ka-pu-se-ru. Le 'u' final est très court en japonais."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Dans un capsule hôtel, on partage généralement les douches et les bains",isTrue:true,explanation:"Correct ! Les douches et les bains sont communs. Les espaces sont souvent séparés par genre. La plupart ont des 大浴場 (grand bain commun).",word:"大浴場"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Comment dire 'Pouvez-vous me réveiller à 7h ?' à la réception ?",choices:[{text:"7時にモーニングコールをお願いします",subtext:"shichi-ji ni mōningu kōru",isCorrect:true},{text:"7時に起きます",subtext:"shichi-ji ni okimasu",isCorrect:false},{text:"早く寝ます",subtext:"hayaku nemasu",isCorrect:false}],explanation:"「モーニングコール」= réveil téléphonique. 「お願いします」= s'il vous plaît. Phrase complète et polie.",translation:"Réveil à 7h s'il vous plaît"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Le capsule hôtel, ingéniosité japonaise",text:"Les capsule hôtels (カプセルホテル) sont nés à Osaka dans les années 70 pour les salarymen manquant le dernier train. Aujourd'hui des chaînes design comme nine hours offrent une expérience haut de gamme pour 4 000-6 000¥/nuit. Les espaces sont optimisés mais ultra-confortables.",vocab:[{word:"カプセル",translation:"capsule"},{word:"大浴場",kana:"だいよくじょう",translation:"grand bain commun"},{word:"消灯",kana:"しょうとう",translation:"extinction des lumières"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"チェックイン",right:"Arrivée à l'hôtel"},{left:"ロッカー",right:"Casier"},{left:"カプセル",right:"Capsule"},{left:"消灯",right:"Extinction des lumières"}]}},
      ]
    },
    {
      poiId: "grand-hyatt-tokyo", title: "L'hôtel de luxe", description: "Expressions pour communiquer avec le personnel d'un grand hôtel japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"フロント",kana:"ふろんと",romaji:"furonto",translation:"Réception de l'hôtel",example:"「フロントに電話する」= Appeler la réception"}},
        {order:2,type:"INTRO",data:{word:"部屋",kana:"へや",romaji:"heya",translation:"Chambre",example:"「部屋の鍵をください」= La clé de ma chambre, s'il vous plaît"}},
        {order:3,type:"PRONUNCIATION",data:{word:"部屋",kana:"へや",romaji:"he·ya",translation:"Chambre",hint:"2 syllabes très courtes: he-ya. Le 'ya' est bref et net."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「禁煙」signifie chambre avec vue panoramique",isTrue:false,explanation:"禁煙 = non-fumeur. Pour une chambre avec vue, cherchez 眺望 (chōbō) ou demandez 景色のいい部屋はありますか？",word:"禁煙"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux demander des serviettes supplémentaires à la réception. Que dis-tu ?",choices:[{text:"タオルをもっとください",subtext:"taouru wo motto kudasai",isCorrect:true},{text:"部屋を変えてください",subtext:"heya wo kaete kudasai",isCorrect:false},{text:"チェックアウトします",subtext:"chekkuauto shimasu",isCorrect:false}],explanation:"「タオルをもっとください」= Des serviettes supplémentaires s'il vous plaît. もっと = davantage.",translation:"Plus de serviettes s'il vous plaît"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Le service hôtelier japonais : omotenashi",text:"L'omotenashi (おもてなし) est l'art de l'hospitalité japonaise : anticipation des besoins, attention aux détails, service irréprochable. Dans les grands hôtels, le personnel mémorise vos préférences. Les yukata (peignoir japonais) et les pantoufles sont fournis dans les chambres.",vocab:[{word:"おもてなし",translation:"hospitalité parfaite"},{word:"浴衣",kana:"ゆかた",translation:"robe de chambre japonaise"},{word:"朝食付き",kana:"ちょうしょくつき",translation:"petit-déjeuner inclus"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"フロント",right:"Réception"},{left:"禁煙",right:"Non-fumeur"},{left:"朝食付き",right:"Petit-déj inclus"},{left:"チェックアウト",right:"Check-out"}]}},
      ]
    },
    {
      poiId: "7eleven-shinjuku", title: "7-Eleven, ton allié 24h/24", description: "Expressions clés pour passer en caisse au konbini",
      steps: [
        {order:1,type:"INTRO",data:{word:"レジ",kana:"れじ",romaji:"reji",translation:"Caisse",example:"Rejoindre la file pour passer en レジ"}},
        {order:2,type:"INTRO",data:{word:"温める",kana:"あたためる",romaji:"atatameru",translation:"Réchauffer",example:"「温めますか？」= Voulez-vous que je réchauffe ça ?"}},
        {order:3,type:"PRONUNCIATION",data:{word:"ありがとうございます",kana:"ありがとうございます",romaji:"a·ri·ga·tō·go·za·i·ma·su",translation:"Merci beaucoup",hint:"Le 'u' final est muet. Prononce: a-ri-ga-tō-go-za-i-ma-s(u)"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"On peut payer ses factures et imprimer des documents au 7-Eleven",isTrue:true,explanation:"Oui ! Les konbinis offrent de nombreux services : paiement de factures, impressions multifonctions, rechargement de cartes, etc.",word:"コンビニ"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Le caissier dit 「袋はご利用ですか？」. Que veut-il dire ?",choices:[{text:"Voulez-vous un sac ?",subtext:"袋 = sac",isCorrect:true},{text:"Avez-vous une carte fidélité ?",subtext:"ポイントカード",isCorrect:false},{text:"Voulez-vous réchauffer ?",subtext:"温める",isCorrect:false}],explanation:"「袋はご利用ですか？」= Voulez-vous un sac ? Les sacs sont payants depuis 2020 (2-5¥). Dites 「結構です」pour refuser.",translation:"Voulez-vous un sac ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Le konbini : services illimités",text:"Au Japon, les konbinis (コンビニ) sont ouverts 24h/24, 365j/an. Au 7-Eleven, vous pouvez payer vos billets de concert, imprimer des documents, retirer de l'argent (ATM international), et même envoyer des colis. Les sacs plastiques sont payants depuis 2020.",vocab:[{word:"レジ",translation:"caisse"},{word:"袋",kana:"ふくろ",translation:"sac"},{word:"お釣り",kana:"おつり",translation:"monnaie rendue"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"レジ",right:"Caisse"},{left:"温める",right:"Réchauffer"},{left:"袋",right:"Sac"},{left:"お釣り",right:"Monnaie rendue"}]}},
      ]
    },
    {
      poiId: "familymart-shibuya", title: "FamilyMart à Shibuya", description: "Le konbini aux mille saveurs — vocabulaire de caisse et produits phares",
      steps: [
        {order:1,type:"INTRO",data:{word:"ファミチキ",kana:"ふぁみちき",romaji:"famichiki",translation:"Poulet frit FamilyMart",example:"Le ファミチキ est la star culinaire de FamilyMart — croustillant et juteux !"}},
        {order:2,type:"INTRO",data:{word:"ポイントカード",kana:"ぽいんとかーど",romaji:"pointo kādo",translation:"Carte de fidélité",example:"「ポイントカードはありますか？」est la question rituelle à la caisse de tout konbini"}},
        {order:3,type:"PRONUNCIATION",data:{word:"ファミチキ",kana:"ふぁみちき",romaji:"fa·mi·chi·ki",translation:"Poulet frit FamilyMart",hint:"4 syllabes égales: fa-mi-chi-ki"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「温かいもの」désigne des articles froids",isTrue:false,explanation:"温かい (atatakai) = chaud. Pour désigner quelque chose de froid : 冷たい (tsumetai).",word:"温かい"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Comment demander un reçu au caissier ?",choices:[{text:"領収書をください",subtext:"ryōshūsho wo kudasai",isCorrect:true},{text:"袋は要りません",subtext:"fukuro wa irimasen",isCorrect:false},{text:"温めますか",subtext:"atatamemasuka",isCorrect:false}],explanation:"領収書 = reçu officiel (utile pour les remboursements). レシート = ticket de caisse simple.",translation:"Un reçu s'il vous plaît"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"FamilyMart et le jingle légendaire",text:"FamilyMart est reconnaissable à son jingle d'entrée (ファミマの音), devenu emblématique au Japon. La chaîne propose des ファミチキ (poulet frit), des sweets de saison, et des sandwichs japonais. Les FamilyMart proposent aussi des services de livraison Famiport.",vocab:[{word:"ファミチキ",translation:"poulet frit FamilyMart"},{word:"ポイントカード",translation:"carte fidélité"},{word:"領収書",kana:"りょうしゅうしょ",translation:"reçu officiel"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"ファミチキ",right:"Poulet frit"},{left:"ポイントカード",right:"Carte fidélité"},{left:"領収書",right:"Reçu"},{left:"温かい",right:"Chaud"}]}},
      ]
    },
    {
      poiId: "lawson-harajuku", title: "Lawson à Harajuku", description: "Desserts premium et services pratiques du konbini Lawson",
      steps: [
        {order:1,type:"INTRO",data:{word:"スイーツ",kana:"すいーつ",romaji:"suītsu",translation:"Desserts / Sweets",example:"Lawson est réputé pour ses スイーツ premium de la gamme Uchi Café"}},
        {order:2,type:"INTRO",data:{word:"品切れ",kana:"しなぎれ",romaji:"shinagire",translation:"Rupture de stock",example:"「品切れです」= C'est épuisé / en rupture de stock"}},
        {order:3,type:"PRONUNCIATION",data:{word:"スイーツ",kana:"すいーつ",romaji:"suī·tsu",translation:"Desserts",hint:"2 temps: suī-tsu. Le 'u' final est très court (presque muet)."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"On peut retirer de l'argent dans la plupart des Lawson",isTrue:true,explanation:"Correct ! Les Lawson ont des ATM LAWSON Bank qui acceptent souvent les cartes VISA/Mastercard étrangères. Pratique pour retirer des yens !",word:"ATM"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu cherches le rayon des desserts réfrigérés (Uchi Café). Où le trouves-tu ?",choices:[{text:"Dans le frigo au fond du magasin",subtext:"冷蔵コーナー",isCorrect:true},{text:"Sur l'étagère chaude près de la caisse",subtext:"温かいコーナー",isCorrect:false},{text:"À la caisse en supplément",subtext:"レジ横",isCorrect:false}],explanation:"Les desserts Uchi Café sont dans le rayon réfrigéré. Cherchez 「冷蔵」(reizō = réfrigéré) sur les panneaux.",translation:"Dans le frigo"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Lawson : Uchi Café et services",text:"Lawson est connu pour son concept Uchi Café SWEETS — une gamme de desserts japonais de qualité (bûche de crème, daifuku moderne). Les Lawson 100 (tout à 108¥) sont une alternative économique. On peut aussi y acheter des billets de concert via le terminal Loppi.",vocab:[{word:"スイーツ",translation:"desserts"},{word:"品切れ",kana:"しなぎれ",translation:"rupture de stock"},{word:"公共料金",kana:"こうきょうりょうきん",translation:"factures publiques"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"スイーツ",right:"Desserts"},{left:"ATM",right:"Distributeur"},{left:"品切れ",right:"Épuisé"},{left:"冷蔵",right:"Réfrigéré"}]}},
      ]
    },
    {
      poiId: "matsumoto-kiyoshi-akiba", title: "La pharmacie japonaise", description: "Vocabulaire médical de base pour te débrouiller en pharmacie",
      steps: [
        {order:1,type:"INTRO",data:{word:"薬",kana:"くすり",romaji:"kusuri",translation:"Médicament",example:"「風邪薬はどこですか？」= Où sont les médicaments contre le rhume ?"}},
        {order:2,type:"INTRO",data:{word:"風邪薬",kana:"かぜぐすり",romaji:"kazegusuri",translation:"Médicament contre le rhume",example:"Le rayon 風邪薬 est généralement bien indiqué dans les pharmacies japonaises"}},
        {order:3,type:"PRONUNCIATION",data:{word:"薬",kana:"くすり",romaji:"ku·su·ri",translation:"Médicament",hint:"3 syllabes égales: ku-su-ri. Le 'u' dans 'ku' est légèrement sourd."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「頭痛薬」est un médicament pour les maux de ventre",isTrue:false,explanation:"頭痛 (zutsū) = mal de tête. Pour les maux de ventre : 胃腸薬 (ichōyaku). Retiens : 頭 = tête, 胃腸 = estomac/intestins.",word:"頭痛薬"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Vous avez de la fièvre. Quelle phrase utilises-tu en pharmacie ?",choices:[{text:"熱があります",subtext:"netsuga arimasu",isCorrect:true},{text:"喉が痛い",subtext:"nodo ga itai",isCorrect:false},{text:"咳が出ます",subtext:"seki ga demasu",isCorrect:false}],explanation:"「熱があります」= J'ai de la fièvre. 喉が痛い = j'ai mal à la gorge. 咳が出ます = je tousse.",translation:"J'ai de la fièvre"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Matsumoto Kiyoshi et la pharmacie japonaise",text:"Matsumoto Kiyoshi (マツモトキヨシ) est la plus grande chaîne de pharmacies du Japon. On y trouve médicaments, cosmétiques, et produits duty-free (免税) pour les touristes. Les pharmaciens peuvent recommander des produits sans ordonnance. Certains médicaments français n'ont pas d'équivalent exact — montrez la notice.",vocab:[{word:"薬",kana:"くすり",translation:"médicament"},{word:"免税",kana:"めんぜい",translation:"détaxe"},{word:"熱",kana:"ねつ",translation:"fièvre"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"薬",right:"Médicament"},{left:"風邪",right:"Rhume"},{left:"熱",right:"Fièvre"},{left:"免税",right:"Détaxe"}]}},
      ]
    },
    {
      poiId: "tokyo-central-post", title: "La Poste au Japon", description: "Envoyer cartes postales et colis depuis Japan Post",
      steps: [
        {order:1,type:"INTRO",data:{word:"切手",kana:"きって",romaji:"kitte",translation:"Timbre",example:"Acheter une 切手 pour envoyer une carte postale en France"}},
        {order:2,type:"INTRO",data:{word:"荷物",kana:"にもつ",romaji:"nimotsu",translation:"Colis / Bagage",example:"Envoyer un 荷物 d'hôtel en hôtel via le service takkyūbin"}},
        {order:3,type:"PRONUNCIATION",data:{word:"切手",kana:"きって",romaji:"kit·te",translation:"Timbre",hint:"2 syllabes: kit-te. Le 't' est doublé (consonne géminée japonaise)."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「ゆうパック」est un service d'emballage cadeau",isTrue:false,explanation:"ゆうパック est le service de livraison de colis de Japan Post. Pour l'emballage cadeau : ラッピング (rappingu).",word:"ゆうパック"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux envoyer une carte postale en France. Que demandes-tu ?",choices:[{text:"フランスまでいくらですか？",subtext:"France made ikura desu ka?",isCorrect:true},{text:"この封筒はありますか？",subtext:"kono fūtō wa arimasu ka?",isCorrect:false},{text:"速達でお願いします",subtext:"sokutatsu de onegaishimasu",isCorrect:false}],explanation:"「フランスまでいくらですか？」= Combien pour envoyer en France ? Une carte postale vers la France coûte ~90¥.",translation:"Combien pour la France ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Japan Post et le takkyūbin",text:"Japan Post (日本郵便) est extrêmement fiable. Les boîtes aux lettres rouges sont partout. Le takkyūbin (宅急便) permet d'envoyer tes bagages d'hôtel en hôtel — très pratique pour voyager léger ! Le service クール宅急便 existe pour les denrées réfrigérées.",vocab:[{word:"切手",kana:"きって",translation:"timbre"},{word:"荷物",kana:"にもつ",translation:"colis"},{word:"宅急便",kana:"たっきゅうびん",translation:"livraison porte-à-porte"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"切手",right:"Timbre"},{left:"荷物",right:"Colis"},{left:"速達",right:"Express"},{left:"宅急便",right:"Livraison porte-à-porte"}]}},
      ]
    },
    {
      poiId: "starbucks-shibuya", title: "Commander un café", description: "Vocabulaire pour commander ta boisson préférée au Starbucks",
      steps: [
        {order:1,type:"INTRO",data:{word:"テイクアウト",kana:"てぃくあうと",romaji:"tēiku auto",translation:"À emporter",example:"「テイクアウトですか？」= C'est pour emporter ou sur place ?"}},
        {order:2,type:"INTRO",data:{word:"サイズ",kana:"さいず",romaji:"saizu",translation:"Taille",example:"Tall (トール), Grande (グランデ), Venti (ヴェンティ) — même vocabulaire au Japon !"}},
        {order:3,type:"PRONUNCIATION",data:{word:"ラテ",kana:"らて",romaji:"ra·te",translation:"Latte",hint:"2 syllabes: ra-te. Le 'l' devient 'r' en japonais — très fréquent !"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Au Starbucks japonais, on peut commander en anglais sans problème",isTrue:true,explanation:"Oui ! Le personnel Starbucks parle souvent anglais. Mais essaie quand même en japonais — ils apprécient vraiment l'effort !",word:"スターバックス"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux un café glacé à emporter. Que dis-tu ?",choices:[{text:"アイスコーヒーをテイクアウトで",subtext:"aisu kōhī wo tēiku auto de",isCorrect:true},{text:"ホットラテをください",subtext:"hotto rate wo kudasai",isCorrect:false},{text:"ここで飲みます",subtext:"koko de nomimasu",isCorrect:false}],explanation:"アイス = glacé. テイクアウトで = pour emporter. ここで飲みます = je bois ici (sur place).",translation:"Un café glacé à emporter"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Starbucks Shibuya Tsutaya — l'iconique",text:"Le Starbucks Shibuya Tsutaya est l'un des plus célèbres du monde, avec terrasses donnant sur le carrefour de Shibuya. Les Starbucks japonais proposent des boissons exclusives : sakura latte en mars, Hojicha au thé torréfié, et des Frappuccino aux saveurs locales.",vocab:[{word:"テイクアウト",translation:"à emporter"},{word:"アイス",translation:"glacé"},{word:"ホット",translation:"chaud"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"テイクアウト",right:"À emporter"},{left:"アイス",right:"Glacé"},{left:"ホット",right:"Chaud"},{left:"サイズ",right:"Taille"}]}},
      ]
    },
    {
      poiId: "mcdonalds-shibuya", title: "Fast-food japonais", description: "Commande facilement ton repas dans un fast-food à Tokyo",
      steps: [
        {order:1,type:"INTRO",data:{word:"セット",kana:"せっと",romaji:"setto",translation:"Menu / Combo",example:"Commander un セット = burger + frites + boisson à prix réduit"}},
        {order:2,type:"INTRO",data:{word:"注文",kana:"ちゅうもん",romaji:"chūmon",translation:"Commande",example:"「注文よろしいですか？」= Êtes-vous prêt à commander ?"}},
        {order:3,type:"PRONUNCIATION",data:{word:"ハンバーガー",kana:"はんばーがー",romaji:"han·bā·gā",translation:"Hamburger",hint:"3 temps: han-bā-gā. Le 'ā' est un son long, pas un 'r' anglais."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Au McDonald's japonais, on commande toujours au comptoir",isTrue:false,explanation:"La plupart des McDonald's japonais ont des bornes de commande automatiques (タッチパネル) — très pratiques pour les touristes qui peuvent voir les images !",word:"タッチパネル"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux le menu n°3 avec de l'eau. Que dis-tu ?",choices:[{text:"3番のセット、お水で",subtext:"san-ban no setto, omizu de",isCorrect:true},{text:"3番の単品ください",subtext:"san-ban no tanpin kudasai",isCorrect:false},{text:"マックフライポテトを3つ",subtext:"makku furai poteto wo mittsu",isCorrect:false}],explanation:"「3番のセット」= menu n°3. 「お水で」= avec de l'eau. 単品 = à la carte (sans les accompagnements).",translation:"Le menu n°3 avec de l'eau"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"McDonald's japonais : les exclusivités",text:"Le McDonald's japonais propose des créations uniques : Teriyaki Burger (テリヤキバーガー), Shaka Shaka Chicken (poulet qu'on secoue dans son assaisonnement), et des McFlurry aux saveurs japonaises. Les bornes tactiles ont souvent une option langue étrangère.",vocab:[{word:"セット",translation:"menu/combo"},{word:"単品",kana:"たんぴん",translation:"à la carte"},{word:"お会計",kana:"おかいけい",translation:"l'addition"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"セット",right:"Menu/Combo"},{left:"注文",right:"Commande"},{left:"単品",right:"À la carte"},{left:"お会計",right:"L'addition"}]}},
      ]
    },
    {
      poiId: "asahi-super-dry-hall", title: "L'izakaya japonais", description: "Trinquer, commander et comprendre la culture de l'après-travail japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"乾杯",kana:"かんぱい",romaji:"kanpai",translation:"Tchin-tchin / Santé",example:"Porter un toast avec 「乾杯！」en levant son verre"}},
        {order:2,type:"INTRO",data:{word:"生ビール",kana:"なまびーる",romaji:"nama bīru",translation:"Bière pression",example:"Commander une 生ビール bien fraîche dès l'arrivée"}},
        {order:3,type:"PRONUNCIATION",data:{word:"乾杯",kana:"かんぱい",romaji:"kan·pai",translation:"Santé / Tchin-tchin",hint:"2 syllabes: kan-pai. L'accent est sur 'kan'. Crie-le fort !"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「お通し」est un dessert gratuit offert en début de repas",isTrue:false,explanation:"お通し est un amuse-bouche (appetizer) automatiquement servi — et facturé ~300-500¥. Ce n'est pas un dessert, c'est la tradition izakaya en guise de 'couverts'.",word:"お通し"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Le serveur demande 「お飲み物はいかがですか？」. Que veut-il dire ?",choices:[{text:"Que voulez-vous boire ?",subtext:"飲み物 = boisson",isCorrect:true},{text:"Êtes-vous prêt à commander ?",subtext:"ご注文は？",isCorrect:false},{text:"La cuisine vous a plu ?",subtext:"お口に合いましたか？",isCorrect:false}],explanation:"「お飲み物はいかがですか？」= Que voulez-vous boire ? いかがですか = comment vous semble ~ ? (forme très polie)",translation:"Que voulez-vous boire ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"L'izakaya et la culture nomikai",text:"L'izakaya (居酒屋) est le bar-restaurant japonais typique de l'après-travail. La nomikai (飲み会 = soirée alcool entre collègues) est un rituel social important. On commande souvent des 焼き鳥 (yakitori), des 枝豆 (edamame), et de la 唐揚げ (karaage). L'Asahi Super Dry Hall est un symbole de Tokyo.",vocab:[{word:"乾杯",kana:"かんぱい",translation:"santé/tchin-tchin"},{word:"生ビール",kana:"なまびーる",translation:"bière pression"},{word:"お通し",translation:"amuse-bouche imposé"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"乾杯",right:"Tchin-tchin"},{left:"生ビール",right:"Bière pression"},{left:"お通し",right:"Amuse-bouche"},{left:"焼き鳥",right:"Brochettes de poulet"}]}},
      ]
    },
  ];

  for (const l of TOKYO_LESSONS_1) {
    const exists = await prisma.lesson.findUnique({ where: { poiId: l.poiId } });
    if (!exists) {
      await prisma.lesson.create({
        data: {
          poiId: l.poiId, title: l.title, description: l.description,
          steps: { create: l.steps.map(s => ({ order: s.order, type: s.type as import("@prisma/client").StepType, data: s.data })) },
        },
      });
    }
  }
  console.log("Tokyo lessons batch 1 seeded.");

  // ── Tokyo Lessons (batch 2: shopping + culture) ───────────────────────────────

  const TOKYO_LESSONS_2 = [
    {
      poiId: "loft-shibuya", title: "Shopping chez Loft", description: "Cherche et achète papeterie, gadgets et lifestyle dans ce temple du design japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"文房具",kana:"ぶんぼうぐ",romaji:"bunbōgu",translation:"Papeterie / Fournitures de bureau",example:"Le rayon 文房具 est souvent au 3e étage de Loft"}},
        {order:2,type:"INTRO",data:{word:"探す",kana:"さがす",romaji:"sagasu",translation:"Chercher",example:"「〇〇を探しています」= Je cherche ~ (formule utile dans tous les magasins)"}},
        {order:3,type:"PRONUNCIATION",data:{word:"文房具",kana:"ぶんぼうぐ",romaji:"bun·bō·gu",translation:"Papeterie",hint:"3 syllabes: bun-bō-gu. Le 'bō' est long."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Loft est principalement un magasin de vêtements",isTrue:false,explanation:"Loft (ロフト) est spécialisé dans la papeterie, les articles de maison, le lifestyle et les gadgets. Pour les vêtements, allez plutôt à Shibuya 109 ou Lumine.",word:"ロフト"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu cherches des stylos japonais (Pilot, Zebra...). Quelle question poses-tu au vendeur ?",choices:[{text:"ペンコーナーはどこですか？",subtext:"pen kōnā wa doko desu ka?",isCorrect:true},{text:"試着室はありますか？",subtext:"shichakushitsu wa arimasu ka?",isCorrect:false},{text:"返品できますか？",subtext:"henpin dekimasu ka?",isCorrect:false}],explanation:"「ペンコーナーはどこですか？」= Où est le rayon stylos ? 試着室 = cabine d'essayage. 返品 = retour produit.",translation:"Où est le rayon stylos ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Loft, le temple du lifestyle japonais",text:"Loft (ロフト) est un concept store japonais sur plusieurs étages. On y trouve la célèbre papeterie Hobonichi Techo, des carnets Midori, des gadgets maison, des cosmétiques originaux, et d'excellents articles de voyage. Idéal pour les souvenirs originaux.",vocab:[{word:"文房具",kana:"ぶんぼうぐ",translation:"papeterie"},{word:"何階",kana:"なんかい",translation:"quel étage"},{word:"レシート",translation:"ticket de caisse"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"文房具",right:"Papeterie"},{left:"探す",right:"Chercher"},{left:"何階",right:"Quel étage"},{left:"レシート",right:"Ticket de caisse"}]}},
      ]
    },
    {
      poiId: "shibuya-109", title: "Mode à SHIBUYA109", description: "Cabines d'essayage, tailles et vocabulaire shopping mode",
      steps: [
        {order:1,type:"INTRO",data:{word:"試着室",kana:"しちゃくしつ",romaji:"shichakushitsu",translation:"Cabine d'essayage",example:"「試着していいですか？」= Puis-je l'essayer ?"}},
        {order:2,type:"INTRO",data:{word:"サイズ",kana:"さいず",romaji:"saizu",translation:"Taille",example:"「Mサイズはありますか？」= Avez-vous la taille M ?"}},
        {order:3,type:"PRONUNCIATION",data:{word:"試着",kana:"しちゃく",romaji:"shi·cha·ku",translation:"Essayage",hint:"3 syllabes: shi-cha-ku. Le 'sha' est une syllabe combinée."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「Mサイズはありますか？」signifie 'Avez-vous la taille M ?'",isTrue:true,explanation:"Correct ! M = Medium. Attention : les tailles japonaises sont souvent plus petites qu'en Europe. Un M japonais peut correspondre à un S européen.",word:"Mサイズ"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu aimes une robe mais elle est trop grande. Que dis-tu ?",choices:[{text:"もう少し小さいサイズはありますか？",subtext:"mō sukoshi chiisai saizu",isCorrect:true},{text:"これはいくらですか？",subtext:"kore wa ikura desu ka?",isCorrect:false},{text:"交換できますか？",subtext:"kōkan dekimasu ka?",isCorrect:false}],explanation:"「もう少し小さいサイズはありますか？」= Avez-vous une taille un peu plus petite ? もう少し = un peu plus. 小さい = petit.",translation:"Avez-vous une taille plus petite ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Shibuya 109 — QG de la mode tokyoïte",text:"Shibuya 109 (いちまるきゅう) est le temple de la mode ギャル (gyaru) depuis les années 90. Aujourd'hui il mélange streetwear et styles Harajuku. Chaque boutique est gérée de façon indépendante. Les vendeuses sont souvent très stylées — ce sont des ambassadrices de leur marque.",vocab:[{word:"試着室",kana:"しちゃくしつ",translation:"cabine d'essayage"},{word:"値引き",kana:"ねびき",translation:"réduction"},{word:"返品",kana:"へんぴん",translation:"retour produit"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"試着室",right:"Cabine d'essayage"},{left:"サイズ",right:"Taille"},{left:"値引き",right:"Réduction"},{left:"返品",right:"Retour produit"}]}},
      ]
    },
    {
      poiId: "donquijote-shibuya", title: "Don Quijote — le paradis du prix bas", description: "Détaxe, bonnes affaires et vocabulaire shopping chez Donki",
      steps: [
        {order:1,type:"INTRO",data:{word:"免税",kana:"めんぜい",romaji:"menzei",translation:"Détaxe / Tax-free",example:"Faire ses achats en 免税 avec son passeport pour économiser 10% de taxe"}},
        {order:2,type:"INTRO",data:{word:"安い",kana:"やすい",romaji:"yasui",translation:"Bon marché / Pas cher",example:"Don Quijote est réputé pour ses prix 安い sur tout : cosmétiques, snacks, gadgets"}},
        {order:3,type:"PRONUNCIATION",data:{word:"安い",kana:"やすい",romaji:"ya·su·i",translation:"Bon marché",hint:"3 mores: ya-su-i. Chaque voyelle est distincte."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"La détaxe touristique au Japon s'applique dès 1 000¥ d'achat",isTrue:false,explanation:"Le seuil de détaxe est de 5 000¥ hors taxe par jour et par magasin. Présentez votre passeport et votre carte d'embarquement au comptoir 免税.",word:"免税"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux acheter en tax-free. Qu'apportes-tu au comptoir 免税 ?",choices:[{text:"Mon passeport et les articles à acheter",subtext:"パスポート + 商品",isCorrect:true},{text:"Seulement le reçu",subtext:"レシートだけ",isCorrect:false},{text:"Ma carte de crédit uniquement",subtext:"クレジットカード",isCorrect:false}],explanation:"Pour la détaxe, il faut présenter votre passeport. Les articles sont parfois mis sous scellé jusqu'à votre départ du Japon.",translation:"Passeport + les articles"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Don Quijote (ドンキ) — une institution",text:"Don Quijote (ドン・キホーテ, surnommé ドンキ) est LA destination pour les souvenirs, cosmétiques, snacks et gadgets à prix réduit. Ses rayons labyrinthiques et sa musique obsédante (「ミラクルショッピング」) sont légendaires. Ouvert jusqu'à 5h du matin dans certains quartiers !",vocab:[{word:"免税",kana:"めんぜい",translation:"détaxe"},{word:"お土産",kana:"おみやげ",translation:"souvenir"},{word:"安い",kana:"やすい",translation:"bon marché"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"免税",right:"Détaxe"},{left:"安い",right:"Bon marché"},{left:"パスポート",right:"Passeport"},{left:"お土産",right:"Souvenir"}]}},
      ]
    },
    {
      poiId: "yodobashi-akiba", title: "Électronique à Akihabara", description: "Voltage, garanties et vocabulaire pour acheter de l'électronique au Japon",
      steps: [
        {order:1,type:"INTRO",data:{word:"充電器",kana:"じゅうでんき",romaji:"jūdenki",translation:"Chargeur",example:"Acheter un 充電器 universel compatible avec les prises japonaises"}},
        {order:2,type:"INTRO",data:{word:"電圧",kana:"でんあつ",romaji:"den'atsu",translation:"Voltage / Tension électrique",example:"Vérifier la 電圧 supportée avant d'acheter (100V au Japon)"}},
        {order:3,type:"PRONUNCIATION",data:{word:"充電器",kana:"じゅうでんき",romaji:"jū·den·ki",translation:"Chargeur",hint:"3 syllabes: jū-den-ki. Le 'jū' est long."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Le voltage au Japon est de 220V comme en Europe",isTrue:false,explanation:"Le Japon utilise 100V (50Hz à Tokyo, 60Hz à Osaka). La plupart des appareils modernes sont 100-240V universels. Vérifiez l'étiquette de votre appareil !",word:"電圧"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux acheter un adaptateur de prise japonaise. Que demandes-tu ?",choices:[{text:"プラグアダプターはありますか？",subtext:"puragu adaputā wa arimasu ka?",isCorrect:true},{text:"電池はどこですか？",subtext:"denchi wa doko desu ka?",isCorrect:false},{text:"保証書をください",subtext:"hoshōsho wo kudasai",isCorrect:false}],explanation:"「プラグアダプター」= adaptateur de prise. 電池 = pile/batterie. 保証書 = certificat de garantie.",translation:"Avez-vous un adaptateur de prise ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Akihabara — de l'électronique à la culture otaku",text:"Yodobashi Camera Akihabara (9 étages !) est le plus grand magasin d'électronique de Tokyo. Akihabara (秋葉原) était le paradis de l'électronique dans les années 90. Aujourd'hui, c'est aussi le cœur de la culture otaku : figurines, manga, maid cafés et jeux vidéo côtoient les gadgets high-tech.",vocab:[{word:"充電器",kana:"じゅうでんき",translation:"chargeur"},{word:"電池",kana:"でんち",translation:"pile/batterie"},{word:"保証",kana:"ほしょう",translation:"garantie"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"充電器",right:"Chargeur"},{left:"電池",right:"Pile/Batterie"},{left:"保証",right:"Garantie"},{left:"電圧",right:"Voltage"}]}},
      ]
    },
    {
      poiId: "lumine-est-shinjuku", title: "Le centre commercial", description: "Étages, escalators et services dans un grand centre commercial japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"何階",kana:"なんかい",romaji:"nankai",translation:"Quel étage",example:"「レストランは何階ですか？」= À quel étage sont les restaurants ?"}},
        {order:2,type:"INTRO",data:{word:"案内所",kana:"あんないじょ",romaji:"annaijo",translation:"Bureau d'information",example:"Se rendre à la 案内所 pour obtenir un plan du centre commercial"}},
        {order:3,type:"PRONUNCIATION",data:{word:"エスカレーター",kana:"えすかれーたー",romaji:"e·su·ka·rē·tā",translation:"Escalator",hint:"5 syllabes: e-su-ka-rē-tā. Articule chaque syllabe."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「B1」sur le plan d'un centre commercial signifie 1er étage",isTrue:false,explanation:"B1 = sous-sol 1 (Basement). Au Japon les sous-sols des centres commerciaux sont souvent des 'depachika' (デパ地下) — épicerie fine, pâtisseries, sushis.",word:"地下"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu es perdu dans le centre commercial. Que demandes-tu au personnel ?",choices:[{text:"案内所はどこですか？",subtext:"annaijo wa doko desu ka?",isCorrect:true},{text:"トイレはどこですか？",subtext:"toire wa doko desu ka?",isCorrect:false},{text:"出口はどこですか？",subtext:"deguchi wa doko desu ka?",isCorrect:false}],explanation:"「案内所」= bureau d'information, idéal pour obtenir un plan. Les trois phrases sont utiles — mais pour être orienté, l'案内所 est le meilleur choix.",translation:"Où est le bureau d'information ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Lumine Est et les centres commerciaux japonais",text:"Lumine Est Shinjuku est un centre commercial mode situé côté est de Shinjuku, visant les femmes actives. En sous-sol : alimentation. En haut : restaurants avec vue. Le concept depachika (デパ地下 = sous-sol de grand magasin) est unique au Japon : une gastronomie de luxe accessible à tous.",vocab:[{word:"何階",kana:"なんかい",translation:"quel étage"},{word:"地下",kana:"ちか",translation:"sous-sol"},{word:"屋上",kana:"おくじょう",translation:"toit-terrasse"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"何階",right:"Quel étage"},{left:"案内所",right:"Bureau d'information"},{left:"地下",right:"Sous-sol"},{left:"屋上",right:"Toit-terrasse"}]}},
      ]
    },
    {
      poiId: "tokyo-skytree", title: "La Tokyo Skytree", description: "Vocabulaire pour monter au sommet de la plus haute tour du Japon",
      steps: [
        {order:1,type:"INTRO",data:{word:"展望台",kana:"てんぼうだい",romaji:"tenbōdai",translation:"Observatoire",example:"Monter à la 展望台 au 350e étage pour voir Tokyo à 360°"}},
        {order:2,type:"INTRO",data:{word:"予約",kana:"よやく",romaji:"yoyaku",translation:"Réservation",example:"Faire une 予約 en ligne pour éviter 2h de queue à la caisse"}},
        {order:3,type:"PRONUNCIATION",data:{word:"展望台",kana:"てんぼうだい",romaji:"ten·bō·dai",translation:"Observatoire",hint:"3 syllabes: ten-bō-dai. Le 'bō' est long."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"La Tokyo Skytree est la plus haute structure du monde",isTrue:false,explanation:"La Tokyo Skytree (634m) est la plus haute tour de transmission du monde. Mais la plus haute structure reste le Burj Khalifa à Dubaï (828m).",word:"東京スカイツリー"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Le ticket standard (Tembo Deck) monte à quelle hauteur ?",choices:[{text:"350m",subtext:"Tembo Deck — vue panoramique",isCorrect:true},{text:"450m",subtext:"Tembo Galleria — supplément",isCorrect:false},{text:"634m",subtext:"le sommet total",isCorrect:false}],explanation:"Le Tembo Deck (天望デッキ) est à 350m. Le Tembo Galleria (天望回廊) monte jusqu'à 450m en supplément. Le sommet à 634m n'est pas accessible au public.",translation:"350m (Tembo Deck)"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"634 se lit 'Musashi'",text:"La Tokyo Skytree (東京スカイツリー) mesure exactement 634m. Ce chiffre n't pas un hasard : 6-3-4 se prononce 「む・さ・し」(Musashi) en japonais, l'ancien nom de la région qui deviendra Tokyo. Au pied : Solamachi, un complexe avec 300 boutiques et un aquarium.",vocab:[{word:"展望台",kana:"てんぼうだい",translation:"observatoire"},{word:"予約",kana:"よやく",translation:"réservation"},{word:"景色",kana:"けしき",translation:"vue/paysage"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"展望台",right:"Observatoire"},{left:"予約",right:"Réservation"},{left:"高い",right:"Haut/Cher"},{left:"景色",right:"Vue"}]}},
      ]
    },
    {
      poiId: "tokyo-tower", title: "La Tokyo Tower", description: "L'emblème de Tokyo en rouge et blanc — histoire et vocabulaire touristique",
      steps: [
        {order:1,type:"INTRO",data:{word:"入場券",kana:"にゅうじょうけん",romaji:"nyūjōken",translation:"Billet d'entrée",example:"Acheter une 入場券 à la caisse du rez-de-chaussée"}},
        {order:2,type:"INTRO",data:{word:"観光",kana:"かんこう",romaji:"kankou",translation:"Tourisme",example:"La Tokyo Tower est un spot 観光 incontournable de Tokyo"}},
        {order:3,type:"PRONUNCIATION",data:{word:"東京タワー",kana:"とうきょうたわー",romaji:"Tō·kyō·Ta·wā",translation:"Tokyo Tower",hint:"4 syllabes: Tō-kyō-Ta-wā. Les deux premières sont longues."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"La Tokyo Tower est peinte en rouge et blanc pour des raisons esthétiques",isTrue:false,explanation:"Le rouge et blanc est imposé par la réglementation aéronautique (règles de sécurité aérienne) pour que les avions puissent voir la tour. La couleur orange-vermillon est devenue son identité.",word:"東京タワー"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Comment demander si la réduction étudiant s'applique ?",choices:[{text:"学生割引はありますか？",subtext:"gakusei waribiki wa arimasu ka?",isCorrect:true},{text:"両方の展望台が入っていますか？",subtext:"ryōhō no...",isCorrect:false},{text:"閉館時間はいつですか？",subtext:"heikan jikan wa itsu desu ka?",isCorrect:false}],explanation:"「学生割引」= réduction étudiant. 割引 = réduction. N'oublie pas ta carte étudiante !",translation:"Y a-t-il une réduction étudiant ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"La Tokyo Tower, symbole du Japon d'après-guerre",text:"La Tokyo Tower (東京タワー, 333m) est inspirée de la Tour Eiffel mais plus haute ! Construite en 1958, elle symbolise la reconstruction économique du Japon. Depuis l'ouverture de la Skytree, elle reste un symbole nostalgique apprécié des Japonais. Elle s'illumine de rouge la nuit.",vocab:[{word:"入場券",kana:"にゅうじょうけん",translation:"billet d'entrée"},{word:"割引",kana:"わりびき",translation:"réduction"},{word:"閉館",kana:"へいかん",translation:"fermeture"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"入場券",right:"Billet d'entrée"},{left:"観光",right:"Tourisme"},{left:"割引",right:"Réduction"},{left:"閉館",right:"Fermeture"}]}},
      ]
    },
    {
      poiId: "meiji-jingu", title: "Le sanctuaire Meiji", description: "Étiquette et vocabulaire pour visiter un sanctuaire shinto",
      steps: [
        {order:1,type:"INTRO",data:{word:"お参り",kana:"おまいり",romaji:"omairi",translation:"Visite/Prière au sanctuaire",example:"Faire son お参り en suivant l'étiquette traditionnelle shinto"}},
        {order:2,type:"INTRO",data:{word:"鳥居",kana:"とりい",romaji:"torii",translation:"Portail shinto",example:"Passer sous la 鳥居 pour entrer dans l'espace sacré du sanctuaire"}},
        {order:3,type:"PRONUNCIATION",data:{word:"鳥居",kana:"とりい",romaji:"to·ri·i",translation:"Portail shinto",hint:"3 mores: to-ri-i. Le dernier 'i' est court mais distinct."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Au sanctuaire shinto, on frappe dans ses mains 3 fois lors de la prière",isTrue:false,explanation:"Le rituel correct est : 2 saluts profonds (二礼), 2 frappements de mains (二拍手), 1 salut final (一礼). Mémorise : 二礼二拍手一礼.",word:"二礼二拍手一礼"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux acheter un porte-bonheur au sanctuaire. Comment s'appelle-t-il ?",choices:[{text:"お守り",subtext:"omamori",isCorrect:true},{text:"御朱印",subtext:"goshuin",isCorrect:false},{text:"絵馬",subtext:"ema",isCorrect:false}],explanation:"お守り = porte-bonheur à garder sur soi. 御朱印 = sceau calligraphié du temple. 絵馬 = plaquette de bois pour écrire ses vœux.",translation:"Porte-bonheur"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Meiji Jingū — la forêt artificielle de Tokyo",text:"Meiji Jingū (明治神宮) est dédié à l'Empereur Meiji (1852-1912). Il est entouré d'une forêt artificielle de 100 000 arbres offerts de partout au Japon lors de sa création en 1920. Le calme absolu règne à 10 minutes à pied de Harajuku. Gratuit, ouvert du lever au coucher du soleil.",vocab:[{word:"お参り",kana:"おまいり",translation:"prière au sanctuaire"},{word:"鳥居",kana:"とりい",translation:"portail shinto"},{word:"お守り",kana:"おまもり",translation:"porte-bonheur"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"お参り",right:"Prière au sanctuaire"},{left:"鳥居",right:"Portail shinto"},{left:"お守り",right:"Porte-bonheur"},{left:"絵馬",right:"Plaquette de vœux"}]}},
      ]
    },
    {
      poiId: "sensoji", title: "Le temple Sensō-ji", description: "Rites bouddhistes, omikuji et vocabulaire pour visiter le plus vieux temple de Tokyo",
      steps: [
        {order:1,type:"INTRO",data:{word:"お守り",kana:"おまもり",romaji:"omamori",translation:"Porte-bonheur",example:"Choisir un お守り selon le vœu souhaité : santé, amour, réussite scolaire..."}},
        {order:2,type:"INTRO",data:{word:"おみくじ",kana:"おみくじ",romaji:"omikuji",translation:"Fortune tirée au sort",example:"Secouer la boîte d'おみくじ pour connaître votre destinée"}},
        {order:3,type:"PRONUNCIATION",data:{word:"雷門",kana:"かみなりもん",romaji:"ka·mi·na·ri·mon",translation:"Porte du Tonnerre",hint:"5 syllabes: ka-mi-na-ri-mon. Prononce chaque syllabe clairement."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「おみくじ」est une fortune tirée au sort dans les temples",isTrue:true,explanation:"Correct ! On secoue une boîte contenant des bâtons numérotés, puis on tire le billet correspondant. Le classement va de 大吉 (grande chance) à 凶 (malchance).",word:"おみくじ"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu tires un mauvais おみくじ (凶 = malchance). Que fais-tu selon la tradition ?",choices:[{text:"Tu le noues à un présentoir du temple",subtext:"結び付ける",isCorrect:true},{text:"Tu le gardes précieusement dans ton portefeuille",subtext:"財布に入れる",isCorrect:false},{text:"Tu le brûles dans l'encensoir",subtext:"焼く",isCorrect:false}],explanation:"On noue le mauvais おみくじ aux présentoirs du temple pour laisser la malchance sur place. Pour un bon tirage, on peut aussi le garder !",translation:"Nouer le papier au temple"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Sensō-ji, 1 400 ans d'histoire",text:"Sensō-ji (浅草寺) est le temple le plus ancien de Tokyo (fondé en 645). La Nakamise-dōri (仲見世通り) qui y mène est bordée de boutiques artisanales et de sucreries traditionnelles : ningyo-yaki, ningen, etc. La grande lanterne rouge de la Kaminarimon pèse 700 kg.",vocab:[{word:"お守り",kana:"おまもり",translation:"porte-bonheur"},{word:"御朱印",kana:"ごしゅいん",translation:"sceau du temple"},{word:"おみくじ",translation:"fortune tirée au sort"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"お守り",right:"Porte-bonheur"},{left:"御朱印",right:"Sceau du temple"},{left:"おみくじ",right:"Fortune au sort"},{left:"仲見世",right:"Galerie marchande"}]}},
      ]
    },
    {
      poiId: "tokyo-national-museum", title: "Le musée national de Tokyo", description: "Trésors nationaux, audio-guides et vocabulaire muséal",
      steps: [
        {order:1,type:"INTRO",data:{word:"展示",kana:"てんじ",romaji:"tenji",translation:"Exposition",example:"Visiter la 展示 permanente consacrée à l'art japonais"}},
        {order:2,type:"INTRO",data:{word:"国宝",kana:"こくほう",romaji:"kokuhō",translation:"Trésor national",example:"Admirer les 国宝 du Japon exposés dans la galerie principale"}},
        {order:3,type:"PRONUNCIATION",data:{word:"国宝",kana:"こくほう",romaji:"ko·ku·hō",translation:"Trésor national",hint:"3 syllabes: ko-ku-hō. Le 'hō' est long."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Le Tokyo National Museum se trouve à Akihabara",isTrue:false,explanation:"Le musée national de Tokyo (東京国立博物館) est à Ueno (上野), dans le parc d'Ueno. Ueno abrite aussi un zoo, le Musée des sciences, et le Musée d'art occidental.",word:"上野"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux un audio-guide en français. Que demandes-tu ?",choices:[{text:"フランス語の音声ガイドはありますか？",subtext:"furansugo no onsei gaido",isCorrect:true},{text:"常設展のチケットをください",subtext:"jōsetsu ten no chiketto",isCorrect:false},{text:"写真を撮ってもいいですか？",subtext:"shashin wo totte mo ii?",isCorrect:false}],explanation:"「フランス語の音声ガイドはありますか？」= Avez-vous un audio-guide en français ? 音声 = audio/son, ガイド = guide.",translation:"Avez-vous un audio-guide en français ?"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Le plus grand musée d'Asie",text:"Le Tokyo National Museum (東京国立博物館, fondé en 1872) est le plus grand musée d'Asie avec plus de 120 000 œuvres dont 89 国宝 (trésors nationaux) et 648 重要文化財 (biens culturels importants). Ses collections couvrent 10 000 ans d'art japonais et asiatique.",vocab:[{word:"展示",kana:"てんじ",translation:"exposition"},{word:"国宝",kana:"こくほう",translation:"trésor national"},{word:"音声ガイド",translation:"audio-guide"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"展示",right:"Exposition"},{left:"国宝",right:"Trésor national"},{left:"常設展",right:"Expo permanente"},{left:"音声ガイド",right:"Audio-guide"}]}},
      ]
    },
    {
      poiId: "tokyo-metro-theatre", title: "Le théâtre japonais", description: "Réserver sa place et découvrir les arts de la scène au Japon",
      steps: [
        {order:1,type:"INTRO",data:{word:"座席",kana:"ざせき",romaji:"zaseki",translation:"Siège / Place",example:"Trouver sa 座席 d'après le numéro inscrit sur le billet"}},
        {order:2,type:"INTRO",data:{word:"公演",kana:"こうえん",romaji:"kōen",translation:"Représentation / Spectacle",example:"Réserver une 公演 de kabuki ou de musique classique"}},
        {order:3,type:"PRONUNCIATION",data:{word:"歌舞伎",kana:"かぶき",romaji:"ka·bu·ki",translation:"Kabuki (théâtre traditionnel)",hint:"3 syllabes nettes: ka-bu-ki. Accent sur la 1ère syllabe."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Au kabuki, on peut crier le nom de l'acteur pendant la représentation",isTrue:true,explanation:"Oui ! On crie 「屋号！」(yagō = nom du clan de l'acteur) aux moments clés de la performance. C'est une tradition appelée 大向こう (ōmukou). Tout un art !",word:"屋号"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu veux louer un casque de traduction simultanée. Que demandes-tu ?",choices:[{text:"同時通訳イヤホンはありますか？",subtext:"dōji tsūyaku iyahon",isCorrect:true},{text:"席を変えてもいいですか？",subtext:"seki wo kaete mo ii?",isCorrect:false},{text:"プログラムをください",subtext:"puroguramu wo kudasai",isCorrect:false}],explanation:"「同時通訳イヤホン」= écouteur de traduction simultanée. Disponible dans beaucoup de théâtres japonais pour les pièces de kabuki et de nō.",translation:"Écouteur de traduction simultanée"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Les arts de la scène japonais",text:"Le Japon a une scène artistique très riche : kabuki (歌舞伎, théâtre stylisé), nō (能, théâtre masqué), rakugo (落語, conte comique solo), taiko (太鼓, percussions). Le Tokyo Metropolitan Theatre à Ikebukuro est un complexe culturel de premier plan.",vocab:[{word:"座席",kana:"ざせき",translation:"siège"},{word:"公演",kana:"こうえん",translation:"représentation"},{word:"幕間",kana:"まくあい",translation:"entracte"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"座席",right:"Siège"},{left:"公演",right:"Représentation"},{left:"幕間",right:"Entracte"},{left:"プログラム",right:"Programme"}]}},
      ]
    },
    {
      poiId: "big-echo-kabukicho", title: "Le karaoké japonais", description: "Réserver une salle privée et chanter en japonais chez Big Echo",
      steps: [
        {order:1,type:"INTRO",data:{word:"予約",kana:"よやく",romaji:"yoyaku",translation:"Réservation",example:"Faire une 予約 pour une salle de karaoké — surtout le week-end !"}},
        {order:2,type:"INTRO",data:{word:"個室",kana:"こしつ",romaji:"koshitsu",translation:"Salle privée",example:"Le karaoké japonais se pratique en 個室 — contrairement aux bars karaoké en France"}},
        {order:3,type:"PRONUNCIATION",data:{word:"カラオケ",kana:"からおけ",romaji:"ka·ra·o·ke",translation:"Karaoké",hint:"4 syllabes égales: ka-ra-o-ke. Pas 'karaoki' — il faut dire le 'e' final !"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「ワンドリンク制」signifie boissons à volonté",isTrue:false,explanation:"ワンドリンク制 = une consommation minimum obligatoire. Pour les boissons illimitées : 飲み放題 (nomihōdai). C'est différent !",word:"飲み放題"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Comment réserver une salle pour 4 personnes pendant 2 heures ?",choices:[{text:"4人で2時間お願いします",subtext:"yonin de niji-kan onegaishimasu",isCorrect:true},{text:"4曲歌いたいです",subtext:"yon-kyoku utaitai desu",isCorrect:false},{text:"2部屋借りたいです",subtext:"ni-heya karitai desu",isCorrect:false}],explanation:"「4人で2時間」= 4 personnes pendant 2 heures. 「お願いします」= s'il vous plaît. Simple et direct !",translation:"4 personnes, 2 heures s'il vous plaît"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Le karaoké, une institution nationale",text:"Le karaoké japonais (カラオケ) se pratique en salles privées (個室), jamais en public. Big Echo est l'une des plus grandes chaînes. Le catalogue compte des millions de chansons : J-pop, anime, enka (musique traditionnelle), rock, et même des classiques internationaux. Prix ~400-800¥/h/pers.",vocab:[{word:"予約",kana:"よやく",translation:"réservation"},{word:"個室",kana:"こしつ",translation:"salle privée"},{word:"飲み放題",kana:"のみほうだい",translation:"boissons illimitées"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"予約",right:"Réservation"},{left:"個室",right:"Salle privée"},{left:"飲み放題",right:"Boissons illimitées"},{left:"曲",right:"Chanson"}]}},
      ]
    },
    {
      poiId: "at-home-cafe-akihabara", title: "Le maid café", description: "Comprendre le jeu de rôle et le vocabulaire du maid café d'Akihabara",
      steps: [
        {order:1,type:"INTRO",data:{word:"ご主人様",kana:"ごしゅじんさま",romaji:"goshujinsama",translation:"Maître/Monseigneur",example:"Les maids accueillent avec 「おかえりなさいませ、ご主人様！」"}},
        {order:2,type:"INTRO",data:{word:"おかえり",kana:"おかえり",romaji:"okaeri",translation:"Bienvenue à la maison",example:"La formule maid café : tu n'es pas un client, tu es à la maison (お家)"}},
        {order:3,type:"PRONUNCIATION",data:{word:"おかえりなさいませ",kana:"おかえりなさいませ",romaji:"o·ka·e·ri·na·sa·i·ma·se",translation:"Bienvenue au foyer",hint:"8 syllabes: o-ka-e-ri-na-sa-i-ma-se. Formule complète — c'est long mais magique !"}},
        {order:4,type:"TRUE_FALSE",data:{statement:"Dans un maid café, les maids peuvent être touchées librement",isTrue:false,explanation:"Strictement interdit ! Les maids ne peuvent pas être touchées sans consentement. Les règles de respect sont fondamentales. Les contrevenants sont expulsés immédiatement.",word:"マナー"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"La maid propose un jeu. Si tu gagnes, elle fait quoi ?",choices:[{text:"Elle dessine un message au ketchup sur ta nourriture",subtext:"ケチャップでお絵描き",isCorrect:true},{text:"Elle te chante une chanson en privé",subtext:"プライベートソング",isCorrect:false},{text:"Tu obtiens un remboursement",subtext:"返金",isCorrect:false}],explanation:"Gagner un jeu au maid café permet souvent d'avoir un dessin au ketchup sur son omurice, une photo polaroïd, ou une dance spéciale. C'est le charme de l'expérience !",translation:"Un dessin au ketchup sur la nourriture"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Les maid cafés — nés à Akihabara",text:"Les maid cafés (メイドカフェ) sont nés à Akihabara dans les années 2000. Les serveuses jouent le rôle de 'maids' dans un univers manga/anime. Le @home café est l'une des chaînes les plus connues. L'expérience coûte ~1 500-3 000¥ avec jeu, photo et formule magique inclus.",vocab:[{word:"ご主人様",kana:"ごしゅじんさま",translation:"Maître/Monseigneur"},{word:"お嬢様",kana:"おじょうさま",translation:"Milady"},{word:"萌え萌えきゅん",translation:"formule magique moe"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"ご主人様",right:"Maître"},{left:"おかえり",right:"Bienvenue chez toi"},{left:"お嬢様",right:"Milady"},{left:"萌え萌えきゅん",right:"Formule magique moe"}]}},
      ]
    },
    {
      poiId: "keio-hospital", title: "À l'hôpital", description: "Décrire ses symptômes et naviguer dans le système de santé japonais",
      steps: [
        {order:1,type:"INTRO",data:{word:"症状",kana:"しょうじょう",romaji:"shōjō",translation:"Symptôme",example:"Décrire ses 症状 clairement à l'infirmière ou au médecin"}},
        {order:2,type:"INTRO",data:{word:"処方箋",kana:"しょほうせん",romaji:"shohōsen",translation:"Ordonnance",example:"Recevoir une 処方箋 du médecin pour aller à la pharmacie"}},
        {order:3,type:"PRONUNCIATION",data:{word:"症状",kana:"しょうじょう",romaji:"shō·jō",translation:"Symptôme",hint:"2 syllabes longues: shō-jō. Les deux sont allongées (macron)."}},
        {order:4,type:"TRUE_FALSE",data:{statement:"「熱があります」signifie 'J'ai froid'",isTrue:false,explanation:"「熱があります」= J'ai de la fièvre. Pour avoir froid : 「寒気がします」(samuke ga shimasu) ou 「寒いです」(samui desu).",word:"熱"}},
        {order:5,type:"CHOOSE_ANSWER",data:{question:"Tu as mal à la gorge. Comment le dis-tu au médecin ?",choices:[{text:"喉が痛いです",subtext:"nodo ga itai desu",isCorrect:true},{text:"頭が痛いです",subtext:"atama ga itai desu",isCorrect:false},{text:"足が痛いです",subtext:"ashi ga itai desu",isCorrect:false}],explanation:"「喉が痛い」= j'ai mal à la gorge. 頭 = tête. 足 = jambe/pied. 〇〇が痛い = j'ai mal à ~.",translation:"J'ai mal à la gorge"}},
        {order:6,type:"CULTURE_NOTE",data:{title:"Soins médicaux pour les touristes à Tokyo",text:"Keio University Hospital (慶應義塾大学病院) est l'un des meilleurs hôpitaux de Tokyo. Pour les touristes : présentez votre passeport à l'accueil. Un service d'interprétation est disponible. Les soins sont payants (pas de sécu française) — gardez tous vos 領収書 (reçus) pour le remboursement assurance.",vocab:[{word:"症状",kana:"しょうじょう",translation:"symptôme"},{word:"処方箋",kana:"しょほうせん",translation:"ordonnance"},{word:"領収書",kana:"りょうしゅうしょ",translation:"reçu/facture"}]}},
        {order:7,type:"MATCH_PAIRS",data:{pairs:[{left:"症状",right:"Symptôme"},{left:"処方箋",right:"Ordonnance"},{left:"熱",right:"Fièvre"},{left:"領収書",right:"Reçu/Facture"}]}},
      ]
    },
  ];

  for (const l of TOKYO_LESSONS_2) {
    const exists = await prisma.lesson.findUnique({ where: { poiId: l.poiId } });
    if (!exists) {
      await prisma.lesson.create({
        data: {
          poiId: l.poiId, title: l.title, description: l.description,
          steps: { create: l.steps.map(s => ({ order: s.order, type: s.type as import("@prisma/client").StepType, data: s.data })) },
        },
      });
    }
  }
  console.log("Tokyo lessons batch 2 seeded.");

  // ── CityRecord + POIRecord (admin DB mirror of cities.ts) ──────────────────
  const CITIES_DATA = [
    {
      id: "tokyo", name: "Tokyo", nameJp: "東京", centerLat: 35.6762, centerLng: 139.6903,
      zoom: 14, pitch: 60, bearing: -20, levelRequired: 1, use3DMap: true, isActive: true,
      pois: [
        { id: "konbini-shinjuku", name: "TEST — Konbini Shinjuku", type: "konbini", lat: 35.6940, lng: 139.7036, description: "Les konbini japonais redéfinissent le concept de commodité : onigiri fraîchement préparés, œufs à la coque marinés dans la soja, café torréfié à la minute, desserts sophistiqués. Ouverts 24h/24, ils sont le QG des noctambules de Kabukichō." },
        { id: "jr-shinjuku", name: "Gare JR Shinjuku", type: "transport", lat: 35.6896, lng: 139.7006, description: "La gare la plus fréquentée au monde avec plus de 3 millions de voyageurs par jour." },
        { id: "tokyo-station-shinkansen", name: "Gare de Tokyo — Shinkansen", type: "transport", lat: 35.6812, lng: 139.7671, description: "Inaugurée en 1914, sa façade en brique rouge est un symbole de l'ère Meiji." },
        { id: "haneda-airport", name: "Aéroport International Haneda", type: "transport", lat: 35.5502, lng: 139.7798, description: "Le premier aéroport de Tokyo, parmi les plus ponctuels au monde." },
        { id: "7eleven-shinjuku", name: "7-Eleven Kabukichō", type: "konbini", lat: 35.6940, lng: 139.7050, description: "7-Eleven est la chaîne de konbini la plus présente au Japon." },
        { id: "familymart-shibuya", name: "FamilyMart Shibuya", type: "konbini", lat: 35.6601, lng: 139.6981, description: "FamilyMart se reconnaît à son jingle d'entrée emblématique." },
        { id: "lawson-harajuku", name: "Lawson Harajuku", type: "konbini", lat: 35.6703, lng: 139.7025, description: "Lawson se distingue par ses Uchi Café desserts haut de gamme." },
        { id: "donquijote-shibuya", name: "Mega Don Quijote Shibuya", type: "shop", lat: 35.6604, lng: 139.6963, description: "Don Quijote, surnommé \"Donki\", est le temple du shopping nocturne japonais." },
        { id: "loft-shibuya", name: "Loft Shibuya", type: "shop", lat: 35.6604, lng: 139.6972, description: "Loft est la référence japonaise pour la papeterie créative." },
        { id: "shibuya-109", name: "SHIBUYA109", type: "shop", lat: 35.6594, lng: 139.6988, description: "Le cylindre blanc de Shibuya est depuis 1979 le sanctuaire de la mode gyaru." },
        { id: "yodobashi-akiba", name: "Yodobashi-Akiba", type: "shop", lat: 35.7000, lng: 139.7727, description: "Le plus grand magasin d'électronique du monde sur un seul site." },
        { id: "lumine-est-shinjuku", name: "Lumine Est Shinjuku", type: "shop", lat: 35.6897, lng: 139.7009, description: "Lumine Est est le centre commercial connecté directement à la sortie est de la gare de Shinjuku." },
        { id: "mcdonalds-shibuya", name: "McDonald's Shibuya", type: "restaurant", lat: 35.6598, lng: 139.6993, description: "Le McDonald's japonais n'est pas celui de chez vous." },
        { id: "starbucks-shibuya", name: "Starbucks Shibuya Scramble", type: "cafe", lat: 35.6595, lng: 139.7003, description: "Le Starbucks le plus instagrammé de Tokyo." },
        { id: "nine-hours-shinjuku", name: "Nine Hours Shinjuku-North", type: "hotel", lat: 35.6963, lng: 139.7044, description: "Nine Hours est la chaîne de capsule hôtels design par excellence." },
        { id: "grand-hyatt-tokyo", name: "Grand Hyatt Tokyo", type: "hotel", lat: 35.6641, lng: 139.7307, description: "Le Grand Hyatt Tokyo trône au cœur de Roppongi Hills." },
        { id: "matsumoto-kiyoshi-akiba", name: "Matsumoto Kiyoshi Akihabara", type: "pharmacie", lat: 35.6987, lng: 139.7712, description: "Matsumoto Kiyoshi est la pharmacie-droguerie la plus connue du Japon." },
        { id: "keio-hospital", name: "Hôpital Keio University", type: "medecin", lat: 35.6863, lng: 139.7199, description: "L'Hôpital Universitaire Keio est l'un des plus réputés du Japon." },
        { id: "tokyo-central-post", name: "Bureau de Poste Central de Tokyo", type: "poste", lat: 35.6804, lng: 139.7678, description: "Le Bureau de Poste Central de Tokyo est ouvert 24h/24." },
        { id: "tokyo-skytree", name: "Tokyo Skytree", type: "site", lat: 35.7101, lng: 139.8107, description: "La plus haute structure du Japon (634 m)." },
        { id: "tokyo-tower", name: "Tour de Tokyo", type: "site", lat: 35.6586, lng: 139.7454, description: "Inaugurée en 1958, la Tour de Tokyo dépasse de 13 mètres la Tour Eiffel." },
        { id: "meiji-jingu", name: "Meiji Jingū", type: "site", lat: 35.6763, lng: 139.6993, description: "Un sanctuaire shinto entouré d'une forêt artificielle de 70 000 arbres." },
        { id: "sensoji", name: "Sensō-ji", type: "site", lat: 35.7148, lng: 139.7967, description: "Le plus ancien temple de Tokyo, fondé en 645 selon la légende." },
        { id: "tokyo-national-museum", name: "Tokyo National Museum", type: "site", lat: 35.7188, lng: 139.7764, description: "Le plus grand musée du Japon, fondé en 1872 dans le parc d'Ueno." },
        { id: "asahi-super-dry-hall", name: "Asahi Super Dry Hall", type: "izakaya", lat: 35.7102, lng: 139.8021, description: "L'iconique bâtiment en or de la brasserie Asahi." },
        { id: "tokyo-metro-theatre", name: "Tokyo Metropolitan Theatre", type: "site", lat: 35.7296, lng: 139.7107, description: "La Tokyo Gei-Jutsu Gekijō à Ikebukuro est la plus grande salle de spectacle." },
        { id: "big-echo-kabukicho", name: "Big Echo Kabukichō", type: "loisir", lat: 35.6940, lng: 139.7027, description: "Big Echo est l'une des plus grandes chaînes de karaoke au Japon." },
        { id: "at-home-cafe-akihabara", name: "@home café Akihabara", type: "loisir", lat: 35.6991, lng: 139.7741, description: "@home café est la chaîne de maid café la plus connue d'Akihabara." },
      ],
    },
    {
      id: "osaka", name: "Osaka", nameJp: "大阪", centerLat: 34.6937, centerLng: 135.5023,
      zoom: 14, pitch: 60, bearing: -20, levelRequired: 2, use3DMap: false, isActive: true,
      pois: [
        { id: "namba-station", name: "Gare de Namba", type: "transport", lat: 34.6623, lng: 135.5019 },
        { id: "umeda-station", name: "Gare d'Umeda", type: "transport", lat: 34.7028, lng: 135.4958 },
        { id: "konbini-namba", name: "Konbini Namba", type: "konbini", lat: 34.6670, lng: 135.5030 },
        { id: "dotonbori", name: "Dōtonbori", type: "izakaya", lat: 34.6686, lng: 135.5016 },
        { id: "shinsekai", name: "Shinsekai", type: "izakaya", lat: 34.6514, lng: 135.5063 },
        { id: "osaka-castle", name: "Château d'Osaka", type: "site", lat: 34.6873, lng: 135.5262 },
        { id: "kuromon-market", name: "Marché Kuromon", type: "market", lat: 34.6648, lng: 135.5083 },
        { id: "sumiyoshi", name: "Sumiyoshi Taisha", type: "site", lat: 34.6132, lng: 135.4933 },
      ],
    },
    {
      id: "kyoto", name: "Kyoto", nameJp: "京都", centerLat: 35.0116, centerLng: 135.7681,
      zoom: 14, pitch: 60, bearing: -20, levelRequired: 3, use3DMap: false, isActive: true,
      pois: [
        { id: "kyoto-station", name: "Gare de Kyoto", type: "transport", lat: 34.9859, lng: 135.7588 },
        { id: "fushimi-inari", name: "Fushimi Inari", type: "site", lat: 34.9671, lng: 135.7727 },
        { id: "kinkakuji", name: "Kinkaku-ji", type: "site", lat: 35.0394, lng: 135.7292 },
        { id: "ginkakuji", name: "Ginkaku-ji", type: "site", lat: 35.0270, lng: 135.7982 },
        { id: "nishiki-market", name: "Marché Nishiki", type: "market", lat: 35.0054, lng: 135.7659 },
        { id: "gion-izakaya", name: "Izakaya de Gion", type: "izakaya", lat: 35.0039, lng: 135.7764 },
        { id: "konbini-kyoto", name: "Konbini", type: "konbini", lat: 35.0088, lng: 135.7595 },
        { id: "nijo-castle", name: "Château Nijō", type: "site", lat: 35.0142, lng: 135.7481 },
      ],
    },
    // Coming soon
    { id: "nara", name: "Nara", nameJp: "奈良", centerLat: 34.6851, centerLng: 135.8048, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
    { id: "hiroshima", name: "Hiroshima", nameJp: "広島", centerLat: 34.3853, centerLng: 132.4553, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
    { id: "sapporo", name: "Sapporo", nameJp: "札幌", centerLat: 43.0618, centerLng: 141.3545, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
    { id: "nikko", name: "Nikkō", nameJp: "日光", centerLat: 36.7198, centerLng: 139.6982, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
    { id: "nagoya", name: "Nagoya", nameJp: "名古屋", centerLat: 35.1815, centerLng: 136.9066, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
    { id: "fukuoka", name: "Fukuoka", nameJp: "福岡", centerLat: 33.5904, centerLng: 130.4017, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
    { id: "beppu", name: "Beppu", nameJp: "別府", centerLat: 33.2840, centerLng: 131.4914, zoom: 14, pitch: 60, bearing: -20, levelRequired: 99, use3DMap: false, isActive: false, pois: [] },
  ];

  for (const city of CITIES_DATA) {
    const { pois, ...cityData } = city;
    await prisma.cityRecord.upsert({
      where: { id: cityData.id },
      update: { name: cityData.name, nameJp: cityData.nameJp, centerLat: cityData.centerLat, centerLng: cityData.centerLng, zoom: cityData.zoom, pitch: cityData.pitch, bearing: cityData.bearing, levelRequired: cityData.levelRequired, use3DMap: cityData.use3DMap },
      create: cityData,
    });
    for (const poi of pois) {
      await prisma.pOIRecord.upsert({
        where: { id: poi.id },
        update: { name: poi.name, type: poi.type, lat: poi.lat, lng: poi.lng, description: (poi as any).description ?? null },
        create: { ...poi, cityId: cityData.id, description: (poi as any).description ?? null },
      });
    }
  }
  console.log("CityRecord + POIRecord seeded.");

  // ── SnsConversation ──────────────────────────────────────────────────────────
  const SNS_SEED = [
    {
      id: "sns-konbini-shinjuku", poiId: "konbini-shinjuku", title: "Message de Haruki",
      context: "Ton ami t'envoie un message pendant que tu fais tes courses.",
      xpReward: 30, isActive: true,
      contact: { name: "ハルキ", handle: "@haruki_tmk", avatar: "🙃", image: "/characters/konbini_vendor.png", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "ねーねー今コンビニいる？w", romaji: "nē nē ima konbini iru? w", fr: "Hé, t'es au konbini là ? lol" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "うん！いるよ〜", romaji: "un! iru yo~", fr: "Ouais j'y suis !", correct: true },
          { id: "y1b", jp: "え、コンビニってスーパーと違うの？", romaji: "e, konbini tte sūpā to chigau no?", fr: "Attends, un konbini c'est pas un supermarché ?", correct: false, feedback: "Tu es DANS le konbini, cette question n'a aucun sens !" },
          { id: "y1c", jp: "今日の天気いいね！", romaji: "kyō no tenki ii ne!", fr: "Il fait beau aujourd'hui !", correct: false, feedback: "C'est complètement hors sujet !" },
        ]},
        { id: "t2", from: "them", jp: "やばー！おにぎり1個だけ買ってきてほしいんだけど🍙", romaji: "yabā! onigiri ikko dake katte kite hoshii n da kedo", fr: "Oh super ! Tu pourrais m'acheter un onigiri ? 🍙" },
        { id: "t3", from: "them", jp: "ツナマヨがいいな〜", romaji: "tsuna mayo ga ii na~", fr: "J'aimerais bien du thon mayo~" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "いいよ〜！他にいる？", romaji: "ii yo~! hoka ni iru?", fr: "Pas de prob ! T'as besoin d'autre chose ?", correct: true },
          { id: "y2b", jp: "あ、コンビニ出ちゃった笑", romaji: "a, konbini dechatta w", fr: "Oh, je viens juste de sortir du konbini lol", correct: false, feedback: "Tu es en train de lui répondre DEPUIS le konbini !" },
          { id: "y2c", jp: "おにぎりって何種類あるの？", romaji: "onigiri tte nanshurui aru no?", fr: "Y'a combien de types d'onigiris ?", correct: false, feedback: "Il t'a demandé de lui acheter, pas un cours sur les onigiris !" },
        ]},
        { id: "t4", from: "them", jp: "ほんと！？ありがとー！めっちゃ助かる🙏", romaji: "honto!? arigatō! meccha tasukaru", fr: "Vraiment !? Merci ! T'es vraiment trop sympa 🙏" },
        { id: "t5", from: "them", jp: "てかお茶も！緑茶ね！", romaji: "teka ocha mo! ryokucha ne!", fr: "Au fait, un thé aussi ! Du thé vert hein !" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "りょ！ちょ待ってて〜", romaji: "ryo! cho matte te~", fr: "OK ! Attends un peu~", correct: true },
          { id: "y3b", jp: "緑茶ってカフェインあるの？", romaji: "ryokucha tte kafein aru no?", fr: "Le thé vert contient de la caféine ?", correct: false, feedback: "Il t'a demandé d'acheter du thé, pas un cours de nutrition !" },
          { id: "y3c", jp: "お茶はどこで飲むの？", romaji: "ocha wa doko de nomu no?", fr: "Où est-ce qu'on boit le thé ?", correct: false, feedback: "Question complètement hors de propos !" },
        ]},
        { id: "t6", from: "them", jp: "マジ神！後でお金払うね〜", romaji: "maji kami! ato de okane harau ne~", fr: "T'es trop fort ! Je te rembourserai après~" },
        { id: "t7", from: "them", jp: "てかなんか食べたいw おすすめ何かある？", romaji: "teka nanka tabetai w osusume nanika aru?", fr: "Bon j'ai faim lol, t'as des reco ?" },
        { id: "y4", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y4a", jp: "サンドイッチめっちゃうまいよ！", romaji: "sandoicchi meccha umai yo!", fr: "Les sandwichs sont vraiment super bons !", correct: true },
          { id: "y4b", jp: "コンビニじゃなくてレストランに行けばw", romaji: "konbini ja nakute resutoran ni ikeba w", fr: "Tu n'as qu'à aller au restaurant lol", correct: false, feedback: "Tu lui demandes de quitter le konbini... alors qu'il t'a demandé un reco konbini !" },
          { id: "y4c", jp: "ペンギンが好き！", romaji: "pengin ga suki!", fr: "J'aime les pingouins !", correct: false, feedback: "Complètement hors sujet xD" },
        ]},
        { id: "t8", from: "them", jp: "うける〜！じゃあそれも！w ほんまありがとな〜！草", romaji: "ukeru~! ja sore mo! w honma arigatō na~! kusa", fr: "Trop drôle ! Prends-le aussi ! lol Vraiment merci ! 😂" },
      ],
    },
    {
      id: "sns-familymart-shibuya", poiId: "familymart-shibuya", title: "Message de Nana",
      context: "Tard le soir, ton amie veut qu'on lui rapporte quelque chose.",
      xpReward: 30, isActive: true,
      contact: { name: "ナナ", handle: "@nana_shibuya", avatar: "🌙", image: "/characters/konbini_vendor.png", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "ねー今コンビニいる？夜食食べたいんだけどw", romaji: "nē ima konbini iru? yashoku tabetai n da kedo w", fr: "Hé t'es au konbini ? J'ai faim pour la collation de nuit lol" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "うん！今いるよ〜何がいい？", romaji: "un! ima iru yo~ nani ga ii?", fr: "Ouais j'y suis~ Tu veux quoi ?", correct: true },
          { id: "y1b", jp: "夜食って太るよw", romaji: "yashoku tte futoru yo w", fr: "Manger la nuit ça fait grossir lol", correct: false, feedback: "Pas la réaction attendue quand quelqu'un a faim !" },
          { id: "y1c", jp: "コンビニって何時まで開いてる？", romaji: "konbini tte nanji made aite ru?", fr: "Le konbini ferme à quelle heure ?", correct: false, feedback: "Les konbinis sont ouverts 24h/24 ! Et tu y es en ce moment !" },
        ]},
        { id: "t2", from: "them", jp: "えー！やばw ありがとー！！", romaji: "ē! yaba w arigatō!!", fr: "Oh cool ! Super !! Merci !!" },
        { id: "t3", from: "them", jp: "カップ麺と甘いものなんかない？チョコとかでいいよ〜", romaji: "kappu men to amai mono nanka nai? choko toka de ii yo~", fr: "Y'a des nouilles cup et des trucs sucrés ? Du chocolat ça va~" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "あるある！どのカップ麺にする？種類いっぱいあるよ〜", romaji: "aru aru! dono kappu men ni suru? shurui ippai aru yo~", fr: "Y'en a ! Tu veux quel cup ? Y'a plein de choix~", correct: true },
          { id: "y2b", jp: "カップ麺は体に悪いよ笑", romaji: "kappu men wa karada ni warui yo w", fr: "Les nouilles cup c'est mauvais pour la santé lol", correct: false, feedback: "Elle t'a demandé d'en acheter, pas un cours de diététique !" },
          { id: "y2c", jp: "カップ麺の作り方わかる？", romaji: "kappu men no tsukurikata wakaru?", fr: "Tu sais comment on prépare les nouilles cup ?", correct: false, feedback: "Hors sujet total, elle te demande juste d'en acheter !" },
        ]},
        { id: "t4", from: "them", jp: "じゃあ日清のどん兵衛！！好きすぎてw", romaji: "ja nissin no donbei!! suki sugite w", fr: "Alors le Donbei de Nissin !! J'adore trop ça lol" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "りょ！チョコは何がいい？いっぱいあるよ〜", romaji: "ryo! choko wa nani ga ii? ippai aru yo~", fr: "OK ! T'as quel choco en tête ? Y'en a plein~", correct: true },
          { id: "y3b", jp: "チョコは虫歯になるよ笑", romaji: "choko wa mushiba ni naru yo w", fr: "Le chocolat ça donne des caries lol", correct: false, feedback: "Encore un conseil de santé non demandé !" },
          { id: "y3c", jp: "チョコって日本語で何ていうの？", romaji: "choko tte nihongo de nan te iu no?", fr: "Comment on dit chocolat en japonais ?", correct: false, feedback: "Tu le lui as demandé en japonais... donc tu le sais déjà !" },
        ]},
        { id: "t5", from: "them", jp: "なんでもいいよ！おまかせ〜w", romaji: "nandemo ii yo! omakase~ w", fr: "N'importe lequel ! Je m'en remets à toi~ lol" },
        { id: "t6", from: "them", jp: "マジありがとー！帰ったら一緒に食べよ！草", romaji: "maji arigatō! kaettara issho ni tabeyō! kusa", fr: "Merci vraiment ! On mange ensemble quand tu rentres ! 😂" },
      ],
    },
    {
      id: "sns-donquijote-shibuya", poiId: "donquijote-shibuya", title: "Message de Ryō",
      context: "Ton ami veut que tu vérifies si un article est dispo.",
      xpReward: 30, isActive: true,
      contact: { name: "リョウ", handle: "@ryo_donki", avatar: "🛒", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "今ドンキにいるよね？w", romaji: "ima donki ni iru yo ne? w", fr: "T'es au Don Quijote là ? lol" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "うん！なんか探してるの？", romaji: "un! nanka sagashiteru no?", fr: "Ouais ! Tu cherches quelque chose ?", correct: true },
          { id: "y1b", jp: "ドンキって何？", romaji: "donki tte nani?", fr: "C'est quoi le Don Quijote ?", correct: false, feedback: "Tu y es EN CE MOMENT... tu sais très bien ce que c'est !" },
          { id: "y1c", jp: "今家にいるよ〜", romaji: "ima ie ni iru yo~", fr: "Je suis à la maison là~", correct: false, feedback: "Il te demande DEPUIS le Don Quijote... alors que tu y es !" },
        ]},
        { id: "t2", from: "them", jp: "え！ちょうどよかった！！", romaji: "e! chōdo yokatta!!", fr: "Oh super tomber bien !!" },
        { id: "t3", from: "them", jp: "ポケモンのぬいぐるみ探してんだけど〜 ピカチュウのでっかいやつ！", romaji: "pokémon no nuigurumi sagashiteru n da kedo~ pikachū no dekkai yatsu!", fr: "Je cherche une peluche Pokémon~ Une grande de Pikachu !" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "ちょっと見てみるね！", romaji: "chotto mite miru ne!", fr: "Je jette un coup d'oeil !", correct: true },
          { id: "y2b", jp: "ピカチュウって誰？", romaji: "pikachū tte dare?", fr: "Pikachu c'est qui ?", correct: false, feedback: "Tout le monde connaît Pikachu !" },
          { id: "y2c", jp: "ぬいぐるみは苦手なんだよね", romaji: "nuigurumi wa nigate na n da yo ne", fr: "J'aime pas trop les peluches moi", correct: false, feedback: "Il t'a demandé de chercher, pas ton avis sur les peluches !" },
        ]},
        { id: "t4", from: "them", jp: "まじ！？ありがとー！もしあったら値段も教えて〜", romaji: "maji!? arigatō! moshi attara nedan mo oshiete~", fr: "Sérieux !? Merci ! Si t'en trouves, dis-moi le prix~" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "りょ！見つけたら連絡するね〜", romaji: "ryo! mitsukettara renraku suru ne~", fr: "OK ! Je te préviens si j'en trouve~", correct: true },
          { id: "y3b", jp: "ポケモンは任天堂だよw", romaji: "pokémon wa nintendō da yo w", fr: "Pokémon c'est Nintendo lol", correct: false, feedback: "C'est une info totalement inutile dans ce contexte !" },
          { id: "y3c", jp: "ドンキって安いの？", romaji: "donki tte yasui no?", fr: "Don Quijote c'est pas cher ?", correct: false, feedback: "Tu y es, tu peux vérifier toi-même !" },
        ]},
        { id: "t5", from: "them", jp: "やばやば！マジ神！🙏", romaji: "yabayaba! maji kami!", fr: "T'es trop fort ! 🙏" },
        { id: "t6", from: "them", jp: "ドンキって全然時間溶けるよねw", romaji: "donki tte zenzen jikan tokeru yo ne w", fr: "Au Don Quijote le temps passe tellement vite lol" },
      ],
    },
    {
      id: "sns-starbucks-shibuya", poiId: "starbucks-shibuya", title: "Message de Haruna",
      context: "Ton amie veut te rejoindre pour un café.",
      xpReward: 30, isActive: true,
      contact: { name: "ハルナ", handle: "@haruna_coffee", avatar: "☕", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "今スタバにいる？w", romaji: "ima sutaba ni iru? w", fr: "T'es au Starbucks là ? lol" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "うん！渋谷スクランブルの！", romaji: "un! shibuya sukuranburu no!", fr: "Ouais ! Celui du Scramble de Shibuya !", correct: true },
          { id: "y1b", jp: "スタバって何のこと？", romaji: "sutaba tte nani no koto?", fr: "C'est quoi le Starbucks ?", correct: false, feedback: "Starbucks c'est la chaîne de café mondiale... et tu y es !" },
          { id: "y1c", jp: "今図書館で勉強中w", romaji: "ima toshokan de benkyō chū w", fr: "Je révise à la bibliothèque là lol", correct: false, feedback: "Tu es AU Starbucks, pas à la bibliothèque !" },
        ]},
        { id: "t2", from: "them", jp: "えw！私も行きたい！今から行っていい？", romaji: "e w! watashi mo ikitai! ima kara itte ii?", fr: "Oh lol ! Moi aussi je veux venir ! Je peux arriver maintenant ?" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "もちろん！いつでもおいでー！", romaji: "mochiron! itsudemo oide~!", fr: "Bien sûr ! Viens quand tu veux !", correct: true },
          { id: "y2b", jp: "スタバって高くない？", romaji: "sutaba tte takakunai?", fr: "Le Starbucks c'est pas un peu cher ?", correct: false, feedback: "Tu es déjà là, c'est un peu tard pour ce débat !" },
          { id: "y2c", jp: "コーヒーは苦手なんだよね", romaji: "kōhī wa nigate na n da yo ne", fr: "Je n'aime pas trop le café moi", correct: false, feedback: "Tu es AU Starbucks... et tu dis que t'aimes pas le café ?!" },
        ]},
        { id: "t3", from: "them", jp: "やったー！！何飲んでるの？", romaji: "yattā!! nani nonde ru no?", fr: "Super !! T'es en train de boire quoi ?" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "抹茶ラテ！めっちゃうまいよ〜！", romaji: "maccha rate! meccha umai yo~!", fr: "Un matcha latte ! C'est trop bon~!", correct: true },
          { id: "y3b", jp: "水を飲んでいます", romaji: "mizu wo nonde imasu", fr: "Je bois de l'eau", correct: false, feedback: "On est au Starbucks, t'aurais pu commander un truc !" },
          { id: "y3c", jp: "まだ注文してない笑", romaji: "mada chūmon shite nai w", fr: "J'ai pas encore commandé lol", correct: false, feedback: "Elle t'a demandé ce que tu bois, ça implique que tu bois quelque chose !" },
        ]},
        { id: "t4", from: "them", jp: "うわー！私もそれにする！！今から行くね！ちょ待ってて〜！", romaji: "uwa~! watashi mo sore ni suru!! ima kara iku ne! cho matte te~!", fr: "Waouh ! La même pour moi !! J'arrive ! Attends~!" },
        { id: "t5", from: "them", jp: "席キープしといてw", romaji: "seki kiipu shitoi te w", fr: "Garde-moi une place lol" },
      ],
    },
    {
      id: "sns-jr-shinjuku", poiId: "jr-shinjuku", title: "Message de Naomi",
      context: "Ton amie s'est perdue dans le labyrinthe de Shinjuku.",
      xpReward: 30, isActive: true,
      contact: { name: "ナオミ", handle: "@naomi_trains", avatar: "🚃", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "今新宿駅どこにいる？w 迷子になったw", romaji: "ima shinjuku eki doko ni iru? w maigo ni natta w", fr: "T'es où dans la gare de Shinjuku ? lol Je me suis perdue lol" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "南口にいるよ！どこにいるの？", romaji: "minami guchi ni iru yo! doko ni iru no?", fr: "Je suis à la sortie sud ! T'es où toi ?", correct: true },
          { id: "y1b", jp: "新宿って東京にあるの？", romaji: "shinjuku tte tōkyō ni aru no?", fr: "Shinjuku c'est à Tokyo ?", correct: false, feedback: "On est à Shinjuku EN CE MOMENT... évidemment c'est à Tokyo !" },
          { id: "y1c", jp: "電車は何時に来るの？", romaji: "densha wa nanji ni kuru no?", fr: "Le train arrive à quelle heure ?", correct: false, feedback: "Elle est perdue, pas en attente d'un train !" },
        ]},
        { id: "t2", from: "them", jp: "え！南口ってどこ！？w", romaji: "e! minami guchi tte doko!? w", fr: "C'est où la sortie sud !? lol" },
        { id: "t3", from: "them", jp: "新宿でか過ぎてわからん笑", romaji: "shinjuku deka sugite wakaran w", fr: "Shinjuku est trop grand je comprends rien lol" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "わかるw！今地図送るね！ちょ待ってて", romaji: "wakaru w! ima chizu okuru ne! cho matte te", fr: "Je comprends lol ! Je t'envoie un plan ! Attends", correct: true },
          { id: "y2b", jp: "新宿は駅が200個くらいあるらしいよ！", romaji: "shinjuku wa eki ga nihyakko kurai aru rashii yo!", fr: "Shinjuku aurait genre 200 sorties apparemment !", correct: false, feedback: "C'est une info inutile pour quelqu'un de perdu !" },
          { id: "y2c", jp: "じゃあ迷子センターに行って笑", romaji: "ja maigo sentā ni itte w", fr: "Va au bureau des objets perdus lol", correct: false, feedback: "Elle n'est pas un enfant perdu !" },
        ]},
        { id: "t4", from: "them", jp: "ありがとー！マジ助かる！！", romaji: "arigatō! maji tasukaru!!", fr: "Merci ! T'es vraiment un sauveur !!" },
        { id: "t5", from: "them", jp: "てか新宿の乗り換えって毎回迷うんだけどw どうやって覚えた？", romaji: "teka shinjuku no norikae tte maikai mayou n da kedo w dō yatte oboeta?", fr: "À chaque fois je me perds pour les correspondances lol, t'as mémorisé comment ?" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "慣れるしかないよ笑！毎日乗ってたらわかるようになるよ！", romaji: "nareru shika nai yo w! mainichi notte tara wakaru yō ni naru yo!", fr: "Faut juste s'y faire lol ! À force tu mémorises !", correct: true },
          { id: "y3b", jp: "新宿は存在しないよw", romaji: "shinjuku wa sonzai shinai yo w", fr: "Shinjuku ça existe pas lol", correct: false, feedback: "On est À Shinjuku..." },
          { id: "y3c", jp: "電車に乗らなければいい笑", romaji: "densha ni noranakere ba ii w", fr: "T'as qu'à ne plus prendre le train lol", correct: false, feedback: "Conseil inutile pour quelqu'un qui vit à Tokyo !" },
        ]},
        { id: "t6", from: "them", jp: "だよねー笑 じゃあ南口で待ってるね！見えたら連絡する！", romaji: "da yo ne~! w ja minami guchi de matte ru ne! mietara renraku suru!", fr: "T'as raison ! lol Alors j'attends à la sortie sud ! Je te préviens !" },
      ],
    },
    {
      id: "sns-at-home-cafe-akihabara", poiId: "at-home-cafe-akihabara", title: "Message de Yuuki",
      context: "Ton ami otaku te contacte depuis Akihabara.",
      xpReward: 30, isActive: true,
      contact: { name: "ユウキ", handle: "@yuuki_akiba", avatar: "🎮", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "今アキバにいるよね？！新しいフィギュア出たんだけど！！", romaji: "ima akiba ni iru yo ne?! atarashii figua deta n da kedo!!", fr: "T'es à Akiba là ?! Un nouveau figurine est sorti !!" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "え！マジ！？どのやつ！？", romaji: "e! maji!? dono yatsu!?", fr: "Quoi ! Sérieux !? Lequel ?!", correct: true },
          { id: "y1b", jp: "フィギュアって食べられるの？", romaji: "figua tte taberareru no?", fr: "Les figurines ça se mange ?", correct: false, feedback: "Non... les figurines ça ne se mange pas !" },
          { id: "y1c", jp: "秋葉原って電車で行けるの？", romaji: "akihabara tte densha de ikeru no?", fr: "On peut y aller en train à Akihabara ?", correct: false, feedback: "Tu y es déjà !" },
        ]},
        { id: "t2", from: "them", jp: "鬼滅の炭治郎！！新しいやつ！！限定版！！", romaji: "kimetsu no tanjirō!! atarashii yatsu!! genteiban!!", fr: "Tanjiro de Demon Slayer !! Le nouveau !! Édition limitée !!" },
        { id: "t3", from: "them", jp: "まじ買うしかないじゃん！！草", romaji: "maji kau shika nai jan!! kusa", fr: "Faut absolument l'acheter !! 😂" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "うわー！それは買うしかないね！笑 いくら？", romaji: "uwa~! sore wa kau shika nai ne! w ikura?", fr: "Wow ! Faut le prendre oui ! lol C'est combien ?", correct: true },
          { id: "y2b", jp: "鬼滅って鬼の話でしょ？怖そうw", romaji: "kimetsu tte oni no hanashi desho? kowasō w", fr: "Demon Slayer c'est une histoire de démons non ? Ça fait peur lol", correct: false, feedback: "C'est une super série, et il te demande l'intérêt de l'acheter pas un résumé !" },
          { id: "y2c", jp: "フィギュアより本物の刀の方がよくない？", romaji: "figua yori honmono no katana no hō ga yoku nai?", fr: "Un vrai katana c'est mieux qu'une figurine non ?", correct: false, feedback: "Complètement hors de propos !" },
        ]},
        { id: "t4", from: "them", jp: "9800円！！高いけどしゃーない！！", romaji: "kyūsen happyaku en!! takai kedo shānai!!", fr: "9800 yens !! C'est cher mais tant pis !!" },
        { id: "t5", from: "them", jp: "一緒に見に来ない？！限定だから早くなくなるよ！！", romaji: "isshoni mi ni konai?! genteida kara hayaku nakunaru yo!!", fr: "Tu veux pas venir voir ?! C'est une édition limitée ça va partir vite !!" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "今から行く！！ちょ待ってて！！", romaji: "ima kara iku!! cho matte te!!", fr: "J'arrive !! Attends un peu !!", correct: true },
          { id: "y3b", jp: "フィギュアって何センチあるの？", romaji: "figua tte nansen chi aru no?", fr: "La figurine fait combien de centimètres ?", correct: false, feedback: "Il t'a invité à venir la voir, pas à demander sa taille !" },
          { id: "y3c", jp: "アキバって遠いよね", romaji: "akiba tte tōi yo ne", fr: "C'est loin Akihabara non", correct: false, feedback: "Tu Y ES déjà !" },
        ]},
        { id: "t6", from: "them", jp: "やったー！！待ってるよ！！絶対後悔しないって！！w", romaji: "yattā!! matte ru yo!! zettai kōkai shinai tte!! w", fr: "Super !! Je t'attends !! Tu regretteras pas !! lol" },
      ],
    },
    {
      id: "sns-tokyo-skytree", poiId: "tokyo-skytree", title: "Message de Kenta",
      context: "Ton ami visite le Tokyo Skytree pour la première fois.",
      xpReward: 30, isActive: true,
      contact: { name: "ケンタ", handle: "@kenta_sky", avatar: "🗼", relation: "Ami(e)" },
      steps: [
        { id: "t1", from: "them", jp: "今スカイツリーいるんだけど！！やばすぎw", romaji: "ima sukaitsurii iru n da kedo!! yaba sugi w", fr: "Je suis au Tokyo Skytree !! C'est dingue lol" },
        { id: "y1", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y1a", jp: "えw！マジ！？景色どう！？", romaji: "e w! maji!? keshiki dō!?", fr: "Oh lol ! Vraiment !? La vue c'est comment ?!", correct: true },
          { id: "y1b", jp: "スカイツリーって食べ物屋さん？", romaji: "sukaitsurii tte tabemono yasan?", fr: "Le Skytree c'est un restaurant ?", correct: false, feedback: "C'est la plus haute tour du Japon !" },
          { id: "y1c", jp: "今雨降ってるの？", romaji: "ima ame futteru no?", fr: "Il pleut là ?", correct: false, feedback: "Il parle de la vue magnifique, pas de la météo !" },
        ]},
        { id: "t2", from: "them", jp: "めっちゃきれい！！東京全体見えるし！！", romaji: "meccha kirei!! tōkyō zentai mieru shi!!", fr: "Super beau !! On voit tout Tokyo !!" },
        { id: "t3", from: "them", jp: "天気いいから富士山まで見えてる！！草", romaji: "tenki ii kara fujisan made miete ru!! kusa", fr: "Il fait beau donc on voit même le Mont Fuji !! 😂" },
        { id: "y2", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y2a", jp: "えw！富士山まで！？やばくない！？", romaji: "e w! fujisan made!? yabakunai!?", fr: "Lol ! Jusqu'au Mont Fuji !? C'est dingue non !?", correct: true },
          { id: "y2b", jp: "富士山って登れるの？", romaji: "fujisan tte noboreru no?", fr: "On peut escalader le Mont Fuji ?", correct: false, feedback: "Il parle de le voir depuis le Skytree, pas de l'escalader !" },
          { id: "y2c", jp: "富士山って北海道にあるよね？", romaji: "fujisan tte hokkaidō ni aru yo ne?", fr: "Le Mont Fuji c'est à Hokkaido non ?", correct: false, feedback: "Non... le Fuji est près de Tokyo ! On vient de le voir depuis là-bas !" },
        ]},
        { id: "t4", from: "them", jp: "ほんとに！！写真撮りまくってるw", romaji: "hontoni!! shashin torimakutte ru w", fr: "Vraiment !! Je prends des tonnes de photos lol" },
        { id: "t5", from: "them", jp: "てか展望デッキって2つあるじゃん！どっちがおすすめ？", romaji: "teka tenbō dekki tte futatsu aru jan! docchi ga osusume?", fr: "Au fait y'a deux terrasses ! Laquelle tu recommandes ?" },
        { id: "y3", from: "you", jp: "", romaji: "", fr: "", choices: [
          { id: "y3a", jp: "天望回廊の方がやばいよ！ガラス床あるし！", romaji: "tenbō kairō no hō ga yabai yo! garasu yuka aru shi!", fr: "La Tembo Galleria c'est trop bien ! Y'a un plancher en verre !", correct: true },
          { id: "y3b", jp: "スカイツリーって何階建て？", romaji: "sukaitsurii tte nankai date?", fr: "Le Skytree fait combien d'étages ?", correct: false, feedback: "Il t'a demandé une recommandation, pas l'architecture du bâtiment !" },
          { id: "y3c", jp: "どっちも怖いから行かない方がいいよw", romaji: "docchi mo kowai kara ikanai hō ga ii yo w", fr: "Les deux font peur, vaut mieux pas y aller lol", correct: false, feedback: "Il est déjà là-haut... un peu tard pour lui dire ça !" },
        ]},
        { id: "t6", from: "them", jp: "うわー！絶対行く！！ありがとー！！", romaji: "uwa~! zettai iku!! arigatō!!", fr: "Waouh ! J'y vais absolument !! Merci !!" },
        { id: "t7", from: "them", jp: "てかガラス床こわいって笑 でも行くw", romaji: "teka garasu yuka kowai tte w demo iku w", fr: "Le plancher en verre ça fait peur lol Mais j'y vais lol" },
      ],
    },
  ];

  for (const conv of SNS_SEED) {
    await prisma.snsConversation.upsert({
      where: { id: conv.id },
      update: { poiId: conv.poiId, title: conv.title, context: conv.context, xpReward: conv.xpReward, contact: conv.contact, steps: conv.steps, isActive: conv.isActive },
      create: conv,
    });
  }
  console.log("SnsConversation seeded.");

  // ── Tutorial — Agent Tanaka (douane) ────────────────────────────────────────

  // Scene
  await prisma.scene.upsert({
    where:  { poiId: "tutorial-douane" },
    update: { backgroundImage: "/backgrounds/aeroport_tutoriel.avif" },
    create: {
      poiId:           "tutorial-douane",
      backgroundImage: "/backgrounds/aeroport_tutoriel.avif",
      entrySound:      null,
      ambientSound:    null,
    },
  });

  // CityRecord (tutorial city — isActive: false, invisible on the map)
  await prisma.cityRecord.upsert({
    where:  { id: "tutorial" },
    update: {},
    create: {
      id:            "tutorial",
      name:          "Aéroport de Tokyo",
      nameJp:        "東京空港",
      centerLat:     35.5494,
      centerLng:     139.7798,
      zoom:          14,
      pitch:         0,
      bearing:       0,
      levelRequired: 0,
      use3DMap:      false,
      isActive:      false,
    },
  });

  // POIRecord
  await prisma.pOIRecord.upsert({
    where:  { id: "tutorial-douane" },
    update: {},
    create: {
      id:          "tutorial-douane",
      cityId:      "tutorial",
      name:        "Contrôle Douanier",
      type:        "transport",
      lat:         35.5494,
      lng:         139.7798,
      description: "Passage du contrôle douanier à l'aéroport de Tokyo — tutoriel",
      isActive:    true,
    },
  });

  // Character
  const WORDS_TANAKA = [
    { furigana: "",       jp: "いらっしゃいませ", romaji: "irasshaimase", fr: "bienvenue" },
    { furigana: "",       jp: "パスポート",         romaji: "pasupōto",    fr: "passeport" },
    { furigana: "はいけん", jp: "拝見",             romaji: "haiken",       fr: "voir (humble)" },
  ];
  await prisma.character.upsert({
    where:  { id: "char-tanaka-douane" },
    update: {
      greetingTranslation: "Bienvenue. Puis-je voir votre passeport, s'il vous plaît ?",
      greetingWords: WORDS_TANAKA,
    },
    create: {
      id:         "char-tanaka-douane",
      name:       "Agent Tanaka",
      nameJp:     "田中さん",
      role:       "Agent de douane",
      image:      "/character_placeholder.png",
      voiceId:    null,
      systemPrompt: `あなたは東京国際空港の入国審査官、田中さんです。
日本語学習者（フランス語話者）向けに、ゆっくり・分かりやすい日本語で話してください。
必要に応じて括弧内に短いフランス語の訳を入れてください（例：「パスポート (passeport)」）。
入国審査の自然な流れを進めてください：パスポート確認 → 来日目的 → 滞在期間 → 滞在先。
正しい回答が得られたら「よし！」や「いいですね！」と励ましてから次の質問へ進んでください。
回答は常に2文以内、短く、親しみやすくしてください。`,
      greetingMessage:     "いらっしゃいませ。パスポートを拝見してもよろしいですか？",
      greetingTranslation: "Bienvenue. Puis-je voir votre passeport, s'il vous plaît ?",
      greetingWords:       WORDS_TANAKA,
      isFriendable:        false,
      isActive:            true,
    },
  });

  // CharacterAppearance
  await prisma.characterAppearance.upsert({
    where:  { characterId_poiId: { characterId: "char-tanaka-douane", poiId: "tutorial-douane" } },
    update: {},
    create: { characterId: "char-tanaka-douane", poiId: "tutorial-douane" },
  });

  // Quest
  const tutorialQuestExists = await prisma.quest.findUnique({ where: { id: "quest-tutorial-douane" } });
  if (!tutorialQuestExists) {
    await prisma.quest.create({
      data: {
        id:          "quest-tutorial-douane",
        poiId:       "tutorial-douane",
        title:       "Passer la douane",
        description: "Entraîne-toi à passer le contrôle douanier à l'aéroport de Tokyo",
        order:       1,
        xpReward:    80,
        tasks: {
          create: [
            {
              id:          "task-tuto-douane-1",
              order:       1,
              instruction: "Saluez l'agent de douane",
              aiContext:   "L'apprenant doit vous saluer en japonais. Attendez un salut (こんにちは ou autre) puis demandez-lui de montrer son passeport.",
              choices: { create: [
                { order: 1, text: "L'agent vous a demandé votre passeport", isCorrect: true },
                { order: 2, text: "L'agent vous a refusé l'entrée",          isCorrect: false },
                { order: 3, text: "L'agent vous a demandé votre billet",     isCorrect: false },
                { order: 4, text: "L'agent ne vous a pas répondu",            isCorrect: false },
              ]},
            },
            {
              id:          "task-tuto-douane-2",
              order:       2,
              instruction: "Montrez votre passeport",
              aiContext:   "L'apprenant doit vous présenter son passeport (dire 「はい、どうぞ」 ou équivalent). Remerciez-le et demandez-lui la raison de sa visite au Japon (来日目的).",
              choices: { create: [
                { order: 1, text: "L'agent vous a demandé le motif de votre visite", isCorrect: true },
                { order: 2, text: "L'agent a tampionné votre passeport et dit au revoir", isCorrect: false },
                { order: 3, text: "L'agent vous a demandé votre carte bancaire",         isCorrect: false },
                { order: 4, text: "L'agent vous a demandé votre adresse en France",      isCorrect: false },
              ]},
            },
            {
              id:          "task-tuto-douane-3",
              order:       3,
              instruction: "Expliquez la raison de votre visite",
              aiContext:   "L'apprenant doit expliquer pourquoi il vient au Japon (tourisme, travail, études, culture…). Validez avec 「よし！」puis demandez la durée du séjour (滞在期間).",
              choices: { create: [
                { order: 1, text: "L'agent a validé et demandé la durée de votre séjour", isCorrect: true },
                { order: 2, text: "L'agent n'a pas compris et vous a demandé de répéter", isCorrect: false },
                { order: 3, text: "L'agent a refusé la raison invoquée",                   isCorrect: false },
                { order: 4, text: "L'agent a terminé le contrôle",                          isCorrect: false },
              ]},
            },
            {
              id:          "task-tuto-douane-4",
              order:       4,
              instruction: "Dites combien de temps vous restez",
              aiContext:   "L'apprenant doit indiquer la durée de son séjour (ex: 一週間、二週間、一ヶ月). Validez avec 「いいですね！」puis demandez l'adresse d'hébergement (滞在先).",
              choices: { create: [
                { order: 1, text: "L'agent a validé et demandé votre adresse au Japon", isCorrect: true },
                { order: 2, text: "L'agent n'a pas compris la durée",                    isCorrect: false },
                { order: 3, text: "L'agent a dit que c'est trop long",                   isCorrect: false },
                { order: 4, text: "L'agent a demandé votre billet de retour",             isCorrect: false },
              ]},
            },
            {
              id:          "task-tuto-douane-5",
              order:       5,
              instruction: "Donnez votre adresse d'hébergement",
              aiContext:   "L'apprenant doit donner son adresse ou hébergement au Japon (ex: 東京のホテルに泊まります). Validez avec 「完璧です！」, tamponnez le passeport et souhaitez-lui un bon séjour (よい滞在を).",
              choices: { create: [
                { order: 1, text: "L'agent a validé et vous a souhaité un bon séjour", isCorrect: true },
                { order: 2, text: "L'agent a demandé l'adresse exacte avec code postal", isCorrect: false },
                { order: 3, text: "L'agent a refusé l'hébergement indiqué",              isCorrect: false },
                { order: 4, text: "L'agent a demandé un justificatif de réservation",     isCorrect: false },
              ]},
            },
          ],
        },
      },
    });
    console.log("Tutorial quest created.");
  }

  // Quest vocab
  type VocabEntry2 = { jp: string; kana: string; romaji: string; fr: string; jlpt: number };
  const tutorialVocab: VocabEntry2[] = [
    { jp: "こんにちは", kana: "こんにちは",   romaji: "konnichiwa",  fr: "bonjour",              jlpt: 5 },
    { jp: "パスポート", kana: "パスポート",   romaji: "pasupōto",    fr: "passeport",             jlpt: 5 },
    { jp: "はい",       kana: "はい",         romaji: "hai",         fr: "oui",                   jlpt: 5 },
    { jp: "どうぞ",     kana: "どうぞ",       romaji: "dōzo",        fr: "voilà / je vous en prie", jlpt: 5 },
    { jp: "観光",       kana: "かんこう",     romaji: "kankō",       fr: "tourisme",              jlpt: 4 },
    { jp: "一週間",     kana: "いっしゅうかん", romaji: "isshūkan",  fr: "une semaine",           jlpt: 5 },
    { jp: "ホテル",     kana: "ホテル",       romaji: "hoteru",      fr: "hôtel",                 jlpt: 5 },
    { jp: "滞在",       kana: "たいざい",     romaji: "taizai",      fr: "séjour",                jlpt: 3 },
  ];
  await prisma.quest.update({
    where: { id: "quest-tutorial-douane" },
    data:  { vocab: tutorialVocab },
  });
  console.log("Tutorial vocab updated.");

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
