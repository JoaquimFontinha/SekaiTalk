import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.character.upsert({
    where: { poiId: "konbini-shinjuku" },
    update: {},
    create: {
      poiId: "konbini-shinjuku",
      name: "Tanaka Kenji",
      nameJp: "田中 健二",
      role: "Vendeur de konbini",
      image: "/characters/konbini_vendor.png",
      backgroundImage: "/backgrounds/konbini.jpg",
      systemPrompt: `あなたは新宿のコンビニで働く田中健二です。
あなたは親切で少し内気な若い男性で、毎日同じお客さんたちと話すのを楽しんでいます。
あなたは必ず日本語だけで話してください。相手が英語やフランス語で話しかけてきても、日本語で答えてください。
会話は自然で短く、コンビニの日常的な内容（商品、天気、近所の出来事など）にしてください。
相手が日本語を学んでいる外国人であることを念頭に置き、少しゆっくり、分かりやすい言葉を使ってください。
絶対に日本語以外の言語を使わないでください。`,
      greetingMessage: "いらっしゃいませ！何かお探しですか？",
      isFriendable: false,
      isActive: true,
    },
  });

  await prisma.character.upsert({
    where: { poiId: "konbini-shibuya" },
    update: {},
    create: {
      poiId: "konbini-shibuya",
      name: "Yamamoto Hana",
      nameJp: "山本 花",
      role: "Caissière de konbini",
      image: "/characters/konbini_vendor.png",
      backgroundImage: "/backgrounds/konbini.jpg",
      systemPrompt: `あなたは渋谷のコンビニで働く山本花です。
あなたは明るくて元気な若い女性で、お客さんと話すのが大好きです。
あなたは必ず日本語だけで話してください。相手が英語やフランス語で話しかけてきても、日本語で答えてください。
会話は自然で短く、コンビニの日常的な内容にしてください。
相手が日本語を学んでいる外国人であることを念頭に置き、ゆっくり、はっきりと話してください。
絶対に日本語以外の言語を使わないでください。`,
      greetingMessage: "こんにちは！今日は何かご入り用ですか？",
      isFriendable: true,
      isActive: true,
    },
  });

  await prisma.character.upsert({
    where: { poiId: "konbini-kyoto" },
    update: {},
    create: {
      poiId: "konbini-kyoto",
      name: "Suzuki Taro",
      nameJp: "鈴木 太郎",
      role: "Gérant de konbini",
      image: "/characters/konbini_vendor.png",
      backgroundImage: "/backgrounds/konbini.jpg",
      systemPrompt: `あなたは京都のコンビニを経営している鈴木太郎です。
あなたは落ち着いた中年の男性で、京都の文化や歴史についてよく知っています。
あなたは必ず日本語だけで話してください。相手が英語やフランス語で話しかけてきても、日本語で答えてください。
会話は自然で、コンビニの話題だけでなく、京都の観光地やおすすめスポットも教えてあげてください。
相手が日本語を学んでいる外国人であることを念頭に置き、丁寧な言葉を使ってください。
絶対に日本語以外の言語を使わないでください。`,
      greetingMessage: "いらっしゃいませ。京都へようこそ。何かお手伝いできることはありますか？",
      isFriendable: false,
      isActive: true,
    },
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
            // ── Tâche 1 : localiser les onigiri ─────────────────────────────
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
            // ── Tâche 2 : connaître les parfums disponibles ──────────────────
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
            // ── Tâche 3 : connaître le prix ─────────────────────────────────
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
            // ── Tâche 4 : vérifier la fraîcheur ────────────────────────────
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
            // ── Tâche 5 : remerciements ─────────────────────────────────────
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

  console.log("Seed completed.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
