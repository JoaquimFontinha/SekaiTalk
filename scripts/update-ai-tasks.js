/**
 * Convertit certaines tâches en validation IA (choices: []).
 * Pour chaque tâche: vide les choices et met à jour l'aiContext avec le critère de validation.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Format aiContext: contexte personnage normal + "\n[CRITÈRE DE VALIDATION] ..."
const AI_TASKS = [
  // ── Haneda — Passer l'immigration ─────────────────────────────────────────
  {
    id: "t-han-1-2",
    instruction: "Dis que tu viens pour le tourisme (観光)",
    aiContext: "Tu es agent d'immigration à Haneda. Demande le but du séjour de l'utilisateur.\n[CRITÈRE DE VALIDATION] L'utilisateur dit en japonais qu'il vient pour le tourisme. Valider: 観光(かんこう)、観光です、観光のため、観光に来ました、旅行(りょこう)、旅行です ou tout équivalent naturel. Ne pas valider: réponse en français/anglais seulement.",
  },
  {
    id: "t-han-1-3",
    instruction: "Dis combien de jours tu restes (例：7日間)",
    aiContext: "Tu es agent d'immigration. Demande la durée du séjour de l'utilisateur.\n[CRITÈRE DE VALIDATION] L'utilisateur mentionne en japonais une durée de séjour avec un nombre + unité de temps. Valider: ex. 七日間、7日間、一週間、1週間、10日、三泊、なんにちかん + chiffre, etc. Ne pas valider si aucun chiffre/durée en japonais n'est mentionné.",
  },

  // ── Haneda — Rejoindre le centre-ville ────────────────────────────────────
  {
    id: "t-han-2-1",
    instruction: "Demande où se trouvent les bus pour Shinjuku",
    aiContext: "Tu es agent à l'aéroport Haneda. Guide l'utilisateur vers les bus limousine.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais où se trouvent les bus pour Shinjuku. Valider: 新宿(しんじゅく)行きのバス、バスはどこ、新宿まで ou tout équivalent. Ne pas valider si Shinjuku ou bus n'est pas mentionné en japonais.",
  },
  {
    id: "t-han-2-3",
    instruction: "Achète ton billet et dis merci",
    aiContext: "Tu es agent de vente de billets de bus à Haneda. Finalise la vente.\n[CRITÈRE DE VALIDATION] L'utilisateur dit merci en japonais après l'achat. Valider: ありがとう、ありがとうございます、どうも、どうもありがとう ou tout remerciement japonais. Ne pas valider si seulement en français/anglais.",
  },

  // ── JR Shinjuku ───────────────────────────────────────────────────────────
  {
    id: "t-jr-1-1",
    instruction: "Demande quelle sortie pour Kabukichō (東口 ou 南口 ?)",
    aiContext: "Tu es agent JR à la gare de Shinjuku. L'utilisateur cherche la sortie Est.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais comment aller à Kabukichō ou quelle sortie prendre. Valider: 歌舞伎町(かぶきちょう)、東口(ひがしぐち)、どこ、どちらの出口 ou combinaison. Ne pas valider si aucun de ces mots en japonais.",
  },
  {
    id: "t-jr-1-3",
    instruction: "Demande quelle ligne pour aller à Shibuya",
    aiContext: "Tu es agent JR à Shinjuku. Indique la ligne Yamanote pour Shibuya.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais comment aller à Shibuya ou quelle ligne prendre. Valider: 渋谷(しぶや)、山手線(やまのてせん)、どの電車、何番線、どうやって行く ou équivalent. Ne pas valider si seulement en français/anglais.",
  },

  // ── 7-Eleven ──────────────────────────────────────────────────────────────
  {
    id: "t-sev-1-1",
    instruction: "Demande où se trouvent les onigiri au saumon",
    aiContext: "Tu travailles au 7-Eleven Kabukichō. Aide l'utilisateur à trouver les onigiri.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais où sont les onigiri (au saumon ou en général). Valider: おにぎり、おにぎりはどこ、さけ(鮭)、サーモン ou combinaison avec どこ/ありますか. Ne pas valider si aucun mot japonais lié aux onigiri.",
  },
  {
    id: "t-sev-1-3",
    instruction: "Demande si les onigiri peuvent être chauffés (温めますか？)",
    aiContext: "Tu travailles au 7-Eleven. L'utilisateur veut réchauffer son onigiri.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais si on peut réchauffer son onigiri. Valider: 温める(あたためる)、温めますか、レンジ、チン、あたためて ou équivalent. Ne pas valider si demande seulement en français/anglais.",
  },

  // ── FamilyMart ────────────────────────────────────────────────────────────
  {
    id: "t-fm-1-3",
    instruction: "Demande des baguettes (箸) et un sac plastique",
    aiContext: "Tu es caissière FamilyMart. L'utilisateur veut des baguettes et un sac.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais des baguettes ET/OU un sac. Valider: 箸(はし)、お箸、袋(ふくろ)、お袋、スプーン ou combinaison. Ne pas valider si seulement en français/anglais.",
  },

  // ── Starbucks ─────────────────────────────────────────────────────────────
  {
    id: "t-sbx-1-1",
    instruction: "Demande un Matcha Latte chaud taille Grande",
    aiContext: "Tu es barista au Starbucks Shibuya Scramble. Prends la commande.\n[CRITÈRE DE VALIDATION] L'utilisateur commande en japonais un matcha latte (chaud ou en spécifiant une taille). Valider: 抹茶(まっちゃ)ラテ、グランデ、ホット、あたたかい、アイス ou combinaison qui montre une commande. Ne pas valider si pas de mot japonais lié à la boisson.",
  },
  {
    id: "t-sbx-1-2",
    instruction: "Demande à réduire le sucre (甘さ控えめで)",
    aiContext: "Tu es barista au Starbucks. L'utilisateur veut personnaliser sa boisson.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais moins de sucre ou une modification du niveau de sucre. Valider: 甘さ控えめ(あまさひかえめ)、砂糖(さとう)少なめ、シロップ少なめ、ゼロシュガー ou équivalent. Ne pas valider si seulement en français/anglais.",
  },

  // ── McDonald's ────────────────────────────────────────────────────────────
  {
    id: "t-mc-1-1",
    instruction: "Demande ce qu'il y a de typiquement japonais dans le menu",
    aiContext: "Tu es caissière au McDonald's Shibuya. Présente les spécialités japonaises.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais les spécialités ou le menu japonais. Valider: 日本(にほん)、和風(わふう)、テリヤキ、月見(つきみ)、おすすめ、メニュー ou combinaison avec interrogatif. Ne pas valider si seulement en français/anglais.",
  },

  // ── Meiji Jingū ───────────────────────────────────────────────────────────
  {
    id: "t-mj-1-2",
    instruction: "Demande comment prier correctement (二拝二拍手一拝)",
    aiContext: "Tu es miko au Meiji Jingū. Explique les rites de prière.\n[CRITÈRE DE VALIDATION] L'utilisateur demande en japonais comment prier ou faire les gestes. Valider: 参拝(さんぱい)、お祈り(いのり)、どうやって、礼(れい)、拝む(おがむ)、作法(さほう)、手順(てじゅん) ou question en japonais sur la prière. Ne pas valider si seulement en français.",
  },

  // ── Sensō-ji ──────────────────────────────────────────────────────────────
  {
    id: "t-sen-1-2",
    instruction: "Tire un omikuji (おみくじ) et demande ce que signifie 大吉",
    aiContext: "Tu es prêtre au Sensō-ji. Explique la signification des omikuji.\n[CRITÈRE DE VALIDATION] L'utilisateur mentionne en japonais l'omikuji ou demande ce que signifie 大吉. Valider: おみくじ、大吉(だいきち)、意味(いみ)、どういう意味、何ですか ou combinaison. Ne pas valider si seulement en français.",
  },

  // ── Asahi Super Dry Hall ──────────────────────────────────────────────────
  {
    id: "t-ash-1-3",
    instruction: "Demande l'addition (お会計をお願いします)",
    aiContext: "Tu es serveur à l'Asahi Super Dry Hall. L'utilisateur veut payer.\n[CRITÈRE DE VALIDATION] L'utilisateur demande l'addition en japonais. Valider: お会計(かいけい)、会計、おかいけい、チェックアウト、払う(はらう)、お勘定(かんじょう) ou phrase demandant à payer. Ne pas valider si seulement en français/anglais.",
  },
];

async function main() {
  let updated = 0;

  for (const task of AI_TASKS) {
    try {
      const result = await prisma.questTask.updateMany({
        where: { id: task.id },
        data:  {
          aiContext: task.aiContext,
          // choices ne peut pas être mis à jour via updateMany (relation)
          // On doit supprimer les choices existantes
        },
      });

      if (result.count > 0) {
        // Supprimer les choices pour marquer comme tâche IA
        await prisma.taskChoice.deleteMany({ where: { taskId: task.id } });
        console.log(`✅  ${task.id} — "${task.instruction.substring(0, 50)}..."`);
        updated++;
      } else {
        console.log(`⚠️  ${task.id} — introuvable en DB`);
      }
    } catch (err) {
      console.error(`❌  ${task.id}:`, err.message);
    }
  }

  console.log(`\n✅  ${updated}/${AI_TASKS.length} tâches converties en validation IA.`);
  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
