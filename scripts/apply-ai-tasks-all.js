const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Toutes les tâches qui sont des AFFIRMATIONS (tu dis, tu expliques, tu présentes, tu confirmes, tu réponds)
// → validation automatique par l'IA
const AI_TASKS = [

  // ── Haneda — Passer l'immigration ─────────────────────────────────────────
  { id: "t-han-1-1",
    aiContext: "Tu es agent d'immigration à Haneda. Accueille l'utilisateur et demande son passeport.\n[CRITÈRE] L'utilisateur dit bonjour ou te présente son passeport en japonais. Valider: こんにちは、はじめまして、どうぞ、パスポートです ou tout salut naturel en japonais.",
  },
  // t-han-1-2 et t-han-1-3 déjà AI

  // ── Haneda — Rejoindre le centre-ville ────────────────────────────────────
  // t-han-2-3 déjà AI

  // ── Shinkansen ────────────────────────────────────────────────────────────
  { id: "t-shk-1-2",
    aiContext: "Tu vends des billets Shinkansen à la Gare de Tokyo. L'utilisateur précise ses préférences de siège.\n[CRITÈRE] L'utilisateur mentionne en japonais au moins une préférence de siège. Valider: 指定席(していせき)、窓側(まどがわ)、禁煙(きんえん)、通路側 ou toute combinaison. Ne pas valider si seulement en français.",
  },
  { id: "t-shk-1-3",
    aiContext: "Tu finalises la vente du billet Shinkansen. L'utilisateur confirme et paye.\n[CRITÈRE] L'utilisateur confirme ou accepte en japonais. Valider: はい、わかりました、お願いします(おねがいします)、確認(かくにん)、いくらですか + accord, などの確認フレーズ. Ne pas valider si seulement en français.",
  },

  // ── Nine Hours ────────────────────────────────────────────────────────────
  { id: "t-nh-1-1",
    aiContext: "Tu es réceptionniste au Nine Hours Shinjuku. L'utilisateur fait son check-in.\n[CRITÈRE] L'utilisateur donne son nom ou dit qu'il a une réservation en japonais. Valider: 予約(よやく)、〜です (nom + です)、予約があります、チェックイン ou équivalent. Ne pas valider si aucun japonais.",
  },

  // ── Grand Hyatt ───────────────────────────────────────────────────────────
  { id: "t-hy-1-1",
    aiContext: "Tu es concierge au Grand Hyatt Tokyo. L'utilisateur fait son check-in et mentionne une réservation.\n[CRITÈRE] L'utilisateur mentionne en japonais qu'il a une réservation ou demande un upgrade. Valider: 予約(よやく)、アップグレード、予約があります、部屋(へや) ou équivalent. Ne pas valider si seulement en français.",
  },

  // ── Matsumoto Kiyoshi ─────────────────────────────────────────────────────
  { id: "t-mat-1-1",
    aiContext: "Tu es pharmacienne à Matsumoto Kiyoshi Akihabara. L'utilisateur décrit ses symptômes.\n[CRITÈRE] L'utilisateur dit en japonais qu'il a mal à la tête ou a de la fièvre. Valider: 頭が痛い(あたまがいたい)、頭痛(ずつう)、熱(ねつ)、痛い(いたい) + 頭 ou équivalent. Ne pas valider si seulement en français.",
  },

  // ── Bureau de Poste ───────────────────────────────────────────────────────
  { id: "t-post-1-1",
    aiContext: "Tu es agent à la Poste Centrale de Tokyo. L'utilisateur veut envoyer un colis.\n[CRITÈRE] L'utilisateur mentionne en japonais qu'il veut envoyer un colis vers la France. Valider: 荷物(にもつ)、小包(こづつみ)、送る(おくる)、フランス、EMS ou combinaison. Ne pas valider si seulement en français.",
  },
  { id: "t-post-1-2",
    aiContext: "Tu remplis la déclaration de douane pour le colis de l'utilisateur.\n[CRITÈRE] L'utilisateur décrit le contenu de son colis en japonais. Valider: 服(ふく)、衣類(いるい)、洋服(ようふく)、液体なし、衣服、お土産 ou tout contenu décrit en japonais. Ne pas valider si seulement en français.",
  },

  // ── SHIBUYA109 ────────────────────────────────────────────────────────────
  { id: "t-109-1-3",
    aiContext: "Tu es vendeuse au SHIBUYA109. L'utilisateur essaie une veste et dit qu'elle est trop grande.\n[CRITÈRE] L'utilisateur dit en japonais que la taille est trop grande ou demande une taille inférieure. Valider: 大きい(おおきい)、大きすぎる、ゆるい、小さいサイズ(サイズ)、Sサイズ ou équivalent. Ne pas valider si seulement en français.",
  },

  // ── Yodobashi ─────────────────────────────────────────────────────────────
  { id: "t-yod-1-1",
    aiContext: "Tu es expert électronique à Yodobashi-Akiba. L'utilisateur cherche un appareil photo.\n[CRITÈRE] L'utilisateur mentionne en japonais qu'il cherche un appareil photo compact avec un budget. Valider: カメラ、コンパクトカメラ、写真(しゃしん)、予算(よさん)、〜円以下 ou combinaison. Ne pas valider si seulement en français.",
  },

  // ── @home café Akihabara ──────────────────────────────────────────────────
  { id: "t-mca-1-1",
    aiContext: "Tu es maid au @home café Akihabara. Tu accueilles l'utilisateur avec おかえりなさいませ.\n[CRITÈRE] L'utilisateur répond ただいま ou entre dans le jeu de rôle en japonais. Valider: ただいま、ただいまです、ただいまー ou toute entrée dans le jeu en japonais. Ne pas valider si seulement en français/anglais.",
  },

  // ── Hôpital Keio ──────────────────────────────────────────────────────────
  { id: "t-hos-1-1",
    aiContext: "Tu es infirmière à l'hôpital Keio. L'utilisateur explique ses symptômes.\n[CRITÈRE] L'utilisateur mentionne en japonais de la fièvre ou mal à la gorge. Valider: 熱(ねつ)、喉が痛い(のどがいたい)、38度、発熱(はつねつ)、痛い(いたい) + 喉/頭 ou équivalent. Ne pas valider si seulement en français.",
  },
];

async function main() {
  let converted = 0;

  for (const task of AI_TASKS) {
    try {
      const updated = await prisma.questTask.updateMany({
        where: { id: task.id },
        data:  { aiContext: task.aiContext },
      });
      if (updated.count > 0) {
        await prisma.taskChoice.deleteMany({ where: { taskId: task.id } });
        console.log(`✅  ${task.id}`);
        converted++;
      } else {
        console.log(`⚠️   ${task.id} — introuvable`);
      }
    } catch (err) {
      console.error(`❌  ${task.id}:`, err.message);
    }
  }

  // Récap final
  const aiCount = AI_TASKS.length + 3; // + les 3 haneda déjà convertis
  console.log(`\n✅  ${converted} nouvelles tâches IA converties.`);
  console.log(`📊  Total tâches IA : ~${aiCount} sur ${28 * 3} tâches au total`);
  console.log("\n📋  Règle appliquée :");
  console.log("   ✅  Affirmations (Dis, Explique, Présente, Confirme, Réponds, Donne) → IA");
  console.log("   ❌  Questions/demandes (Demande, Commande, Achète, Paye, Réserve) → QCM");

  await prisma.$disconnect();
}

main().catch(async err => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
