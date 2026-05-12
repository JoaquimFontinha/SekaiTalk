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
        yenReward: 120,
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
    { jp: "すみません",         kana: "すみません",         romaji: "sumimasen",           fr: "excusez-moi",        jlpt: 5 },
    { jp: "どこ",               kana: "どこ",               romaji: "doko",                fr: "où",                 jlpt: 5 },
    { jp: "おにぎり",           kana: "おにぎり",           romaji: "onigiri",             fr: "boulette de riz",    jlpt: 5 },
    { jp: "ありますか",         kana: "ありますか",         romaji: "arimasu ka",          fr: "est-ce qu'il y a ?", jlpt: 5 },
    { jp: "いくら",             kana: "いくら",             romaji: "ikura",               fr: "combien",            jlpt: 5 },
    { jp: "ありがとうございます", kana: "ありがとうございます", romaji: "arigatou gozaimasu", fr: "merci beaucoup",    jlpt: 5 },
    { jp: "種類",               kana: "しゅるい",           romaji: "shurui",              fr: "type, variété",      jlpt: 4 },
    { jp: "新鮮",               kana: "しんせん",           romaji: "shinsen",             fr: "frais",              jlpt: 4 },
    { jp: "冷蔵庫",             kana: "れいぞうこ",         romaji: "reizouko",            fr: "réfrigérateur",      jlpt: 4 },
    { jp: "今朝",               kana: "けさ",               romaji: "kesa",                fr: "ce matin",           jlpt: 4 },
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

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
