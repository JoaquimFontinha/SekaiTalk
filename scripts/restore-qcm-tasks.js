/**
 * Restore QCM choices for tasks that shouldn't be AI-validated (questions/requests).
 * Only keep AI validation for affirmations (dis que..., j'ai...).
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const RESTORE = [
  // ── Haneda — bus pour Shinjuku (question) ─────────────────────────────────
  { id: "t-han-2-1",
    aiContext: "L'utilisateur cherche le bus limousine pour Shinjuku. Indique-lui le terminal de bus au niveau B1.",
    choices: [
      { order:1, text:"L'agent t'a indiqué le terminal B1", isCorrect:true },
      { order:2, text:"L'agent t'a envoyé au train", isCorrect:false },
      { order:3, text:"L'agent n'a pas compris ta destination", isCorrect:false },
    ]},

  // ── JR Shinjuku — sortie Kabukichō (question) ─────────────────────────────
  { id: "t-jr-1-1",
    aiContext: "L'utilisateur cherche la sortie pour Kabukichō. C'est la 東口 (sortie Est). Explique comment y aller.",
    choices: [
      { order:1, text:"L'agent t'a dit d'aller à la 東口 (sortie Est)", isCorrect:true },
      { order:2, text:"L'agent t'a envoyé à la sortie Sud", isCorrect:false },
      { order:3, text:"L'agent n'a pas compris Kabukichō", isCorrect:false },
    ]},

  // ── JR Shinjuku — ligne pour Shibuya (question) ───────────────────────────
  { id: "t-jr-1-3",
    aiContext: "L'utilisateur veut aller à Shibuya. C'est la ligne Yamanote (山手線), direction Shibuya/Osaki, environ 5 stations.",
    choices: [
      { order:1, text:"L'agent t'a dit la ligne Yamanote, direction Shibuya", isCorrect:true },
      { order:2, text:"L'agent t'a envoyé sur la mauvaise ligne", isCorrect:false },
      { order:3, text:"Tu as demandé Akihabara par erreur", isCorrect:false },
    ]},

  // ── 7-Eleven — onigiri saumon (question) ──────────────────────────────────
  { id: "t-sev-1-1",
    aiContext: "L'utilisateur cherche les onigiri au saumon (さけおにぎり). Indique-lui le réfrigérateur au fond à gauche.",
    choices: [
      { order:1, text:"Tu as trouvé les onigiri au saumon", isCorrect:true },
      { order:2, text:"Tu as pris du thon mayo par erreur", isCorrect:false },
      { order:3, text:"L'employé n'a pas compris ta demande", isCorrect:false },
    ]},

  // ── 7-Eleven — réchauffer (question) ──────────────────────────────────────
  { id: "t-sev-1-3",
    aiContext: "L'utilisateur demande si on peut réchauffer son onigiri au micro-ondes. Oui, le micro-ondes est libre-service au fond du magasin.",
    choices: [
      { order:1, text:"L'employé t'a montré le micro-ondes en libre-service", isCorrect:true },
      { order:2, text:"Tu as mangé l'onigiri froid", isCorrect:false },
      { order:3, text:"L'employé a réchauffé pour toi à la caisse", isCorrect:false },
    ]},

  // ── FamilyMart — baguettes + sac (demande) ────────────────────────────────
  { id: "t-fm-1-3",
    aiContext: "L'utilisateur demande des 箸 (hashi/baguettes) et un 袋 (fukuro/sac). Rappelle-lui que le sac coûte 3 yens depuis la loi de 2020.",
    choices: [
      { order:1, text:"Tu as obtenu tes baguettes et sac (3¥)", isCorrect:true },
      { order:2, text:"Tu as oublié de demander les baguettes", isCorrect:false },
      { order:3, text:"Tu pensais que le sac était gratuit", isCorrect:false },
    ]},

  // ── Starbucks — commander (demande) ──────────────────────────────────────
  { id: "t-sbx-1-1",
    aiContext: "L'utilisateur commande un 抹茶ラテ (matcha latte) chaud, taille グランデ (grande). Répète la commande et demande le prénom pour le gobelet.",
    choices: [
      { order:1, text:"Commande passée, la barista a noté ton prénom", isCorrect:true },
      { order:2, text:"Tu as commandé un thé noir par erreur", isCorrect:false },
      { order:3, text:"Tu as oublié de préciser la taille", isCorrect:false },
    ]},

  // ── Starbucks — réduire sucre (demande) ──────────────────────────────────
  { id: "t-sbx-1-2",
    aiContext: "L'utilisateur veut moins de sucre. Demande-lui le niveau : 甘さ控えめ (réduit), ゼロ (sans sucre).",
    choices: [
      { order:1, text:"La barista a bien noté la réduction de sucre", isCorrect:true },
      { order:2, text:"Tu as oublié de préciser le sucre", isCorrect:false },
      { order:3, text:"Tu as demandé encore plus de sucre", isCorrect:false },
    ]},

  // ── McDonald's — menu japonais (question) ────────────────────────────────
  { id: "t-mc-1-1",
    aiContext: "L'utilisateur demande les spécialités japonaises. Parle du テリヤキバーガー (teriyaki burger) et du 月見バーガー (tsukimi burger, saisonnier avec œuf).",
    choices: [
      { order:1, text:"Tu connais maintenant le テリヤキ et 月見バーガー", isCorrect:true },
      { order:2, text:"La caissière a dit que le menu était identique à la France", isCorrect:false },
      { order:3, text:"Tu as commandé sans poser de questions", isCorrect:false },
    ]},

  // ── Meiji Jingū — comment prier (question) ───────────────────────────────
  { id: "t-mj-1-2",
    aiContext: "La miko explique la méthode de prière : jeter une pièce (5¥ porte-bonheur), deux profondes inclinaisons, deux claquements de mains, un vœu silencieux, une dernière inclinaison.",
    choices: [
      { order:1, text:"Tu maîtrises la méthode 二拝二拍手一拝", isCorrect:true },
      { order:2, text:"Tu as fait les gestes dans le mauvais ordre", isCorrect:false },
      { order:3, text:"Tu as fait une seule inclinaison", isCorrect:false },
    ]},

  // ── Sensō-ji — omikuji 大吉 (question) ───────────────────────────────────
  { id: "t-sen-1-2",
    aiContext: "L'utilisateur tire un おみくじ. Si c'est 大吉 (daikichi), explique que c'est la meilleure fortune, signifiant grand bonheur. Les autres : 吉, 中吉, 小吉, 末吉, 凶. Les mauvais omikuji se nouent dans le temple.",
    choices: [
      { order:1, text:"Tu sais que 大吉 est la meilleure chance", isCorrect:true },
      { order:2, text:"Tu pensais que 凶 était positif", isCorrect:false },
      { order:3, text:"Tu n'as pas voulu tirer l'omikuji", isCorrect:false },
    ]},

  // ── Asahi — l'addition (demande) ─────────────────────────────────────────
  { id: "t-ash-1-3",
    aiContext: "L'utilisateur demande l'addition. Total environ 2600 yens pour 2 bières et edamame. Demande si le paiement est en espèces ou carte.",
    choices: [
      { order:1, text:"L'addition est réglée correctement", isCorrect:true },
      { order:2, text:"Tu as oublié de demander l'addition", isCorrect:false },
      { order:3, text:"Tu as laissé l'autre payer", isCorrect:false },
    ]},
];

async function main() {
  let restored = 0;
  for (const task of RESTORE) {
    try {
      // Update aiContext back to original
      await prisma.questTask.updateMany({
        where: { id: task.id },
        data:  { aiContext: task.aiContext },
      });
      // Recreate choices
      await prisma.taskChoice.createMany({
        data: task.choices.map(c => ({ taskId: task.id, ...c })),
        skipDuplicates: true,
      });
      console.log(`✅  ${task.id} → QCM restauré (${task.choices.length} choix)`);
      restored++;
    } catch (err) {
      console.error(`❌  ${task.id}:`, err.message);
    }
  }
  console.log(`\n✅  ${restored}/${RESTORE.length} tâches restaurées en QCM.`);

  // Summary of remaining AI tasks
  console.log("\n📋  Tâches IA conservées (affirmations) :");
  console.log("   t-han-1-2 — Dis que tu viens pour le tourisme");
  console.log("   t-han-1-3 — Dis combien de jours tu restes");
  console.log("   t-han-2-3 — Achète ton billet et dis merci");

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
