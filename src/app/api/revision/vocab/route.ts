import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMastery, type MasteryLevel } from "@/lib/mastery";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const rows = await prisma.userVocabProgress.findMany({
    where: { userId, encounters: { gt: 0 } },
    orderBy: { lastSeenAt: "desc" },
  });

  const words = rows.map(r => ({
    jp:           r.wordJp,
    kana:         r.kana   || r.wordJp,
    romaji:       r.romaji || "",
    fr:           r.fr     || "",
    jlpt:         r.jlpt   || 5,
    questId:      r.questId  ?? null,
    lessonId:     r.lessonId ?? null,
    encounters:   r.encounters,
    correctCount: r.correctCount,
    errorCount:   r.errorCount,
    lastSeenAt:   r.lastSeenAt.toISOString(),
    mastery:      computeMastery(r.encounters, r.correctCount, r.errorCount) as MasteryLevel,
  }));

  const stats = {
    toWork:   words.filter(w => ["never", "new", "learning"].includes(w.mastery)).length,
    toReview: words.filter(w => ["almost", "acquired"].includes(w.mastery)).length,
    acquired: words.filter(w => w.mastery === "perfect").length,
  };

  return NextResponse.json({ words, stats });
}
