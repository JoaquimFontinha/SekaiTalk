import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildGoalResults, buildEmptyGoalResults } from "@/lib/daily-goals";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId  = (session?.user as any)?.id ?? null;
  const date    = new Date().toISOString().slice(0, 10);

  if (!userId) {
    return NextResponse.json({ date, goals: buildEmptyGoalResults() });
  }

  // Minuit UTC = début de la journée de suivi
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [questsToday, lessonsToday, vocabToday, snsToday, sessionsToday] = await Promise.all([
    prisma.userQuestProgress.count({
      where: { userId, completedAt: { gte: todayStart } },
    }),
    prisma.userLessonProgress.count({
      where: { userId, validated: true, completedAt: { gte: todayStart } },
    }),
    prisma.userVocabProgress.count({
      where: { userId, lastSeenAt: { gte: todayStart } },
    }),
    prisma.userSnsProgress.count({
      where: { userId, completedAt: { gte: todayStart } },
    }),
    prisma.sessionRecord.count({
      where: { userId, createdAt: { gte: todayStart } },
    }),
  ]);

  const goals = buildGoalResults({ questsToday, lessonsToday, vocabToday, snsToday, sessionsToday });

  return NextResponse.json({ date, goals });
}
