import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevel } from "@/lib/levels";

export async function POST(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { questProgressId } = await req.json();
  if (!questProgressId) {
    return NextResponse.json({ error: "questProgressId manquant" }, { status: 400 });
  }

  // Marquer la tâche comme terminée
  await prisma.userTaskProgress.update({
    where: { userQuestProgressId_taskId: { userQuestProgressId: questProgressId, taskId: params.taskId } },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  // Charger la progression complète
  const questProgress = await prisma.userQuestProgress.findUnique({
    where: { id: questProgressId },
    include: {
      quest: {
        include: {
          tasks: { orderBy: { order: "asc" } },
        },
      },
      taskProgress: true,
    },
  });
  if (!questProgress) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allTasks = questProgress.quest.tasks;
  const completedIds = new Set(
    questProgress.taskProgress
      .filter(tp => tp.status === "COMPLETED" || tp.taskId === params.taskId)
      .map(tp => tp.taskId)
  );
  const nextTask = allTasks.find(t => !completedIds.has(t.id));

  // Tâches restantes → débloquer la suivante
  if (nextTask) {
    await prisma.userTaskProgress.create({
      data: { userQuestProgressId: questProgressId, taskId: nextTask.id, status: "PENDING" },
    });
    return NextResponse.json({ questCompleted: false, nextTask: { id: nextTask.id, order: nextTask.order } });
  }

  // ── Quête terminée ──────────────────────────────────────────────────────────
  const isFirstCompletion = !questProgress.firstCompletedAt;
  let xpGained = 0;
  let leveledUp = false;
  let newLevel = 1;

  if (isFirstCompletion) {
    xpGained = questProgress.quest.xpReward;

    if (xpGained > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { xp: true } });
      const oldLevel = getLevel(user?.xp ?? 0);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { xp: { increment: xpGained } },
        select: { xp: true },
      });
      newLevel = getLevel(updatedUser.xp);
      leveledUp = newLevel > oldLevel;
    }

    await prisma.userQuestProgress.update({
      where: { id: questProgressId },
      data: { status: "COMPLETED", completedAt: new Date(), firstCompletedAt: new Date() },
    });
  } else {
    // Replay : compléter sans récompense
    await prisma.userQuestProgress.update({
      where: { id: questProgressId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  return NextResponse.json({ questCompleted: true, nextTask: null, xpGained, leveledUp, newLevel, isReplay: !isFirstCompletion });
}
