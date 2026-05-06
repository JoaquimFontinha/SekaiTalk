import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { questId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const quest = await prisma.quest.findUnique({
    where: { id: params.questId },
    include: { tasks: { orderBy: { order: "asc" }, take: 1 } },
  });
  if (!quest || quest.tasks.length === 0) {
    return NextResponse.json({ error: "Quest introuvable" }, { status: 404 });
  }

  const existing = await prisma.userQuestProgress.findUnique({
    where: { userId_questId: { userId, questId: params.questId } },
    include: { taskProgress: { select: { taskId: true, status: true } } },
  });

  // Première fois : créer la progression
  if (!existing) {
    const progress = await prisma.userQuestProgress.create({
      data: {
        userId,
        questId: params.questId,
        taskProgress: { create: { taskId: quest.tasks[0].id, status: "PENDING" } },
      },
      include: { taskProgress: { select: { taskId: true, status: true } } },
    });
    return NextResponse.json({ ...progress, isReplay: false });
  }

  // En cours : reprendre
  if (existing.status === "IN_PROGRESS") {
    return NextResponse.json({ ...existing, isReplay: false });
  }

  // Terminée → replay : réinitialiser sans toucher à firstCompletedAt
  await prisma.userTaskProgress.deleteMany({
    where: { userQuestProgressId: existing.id },
  });
  await prisma.userQuestProgress.update({
    where: { id: existing.id },
    data: { status: "IN_PROGRESS", completedAt: null },
  });
  await prisma.userTaskProgress.create({
    data: { userQuestProgressId: existing.id, taskId: quest.tasks[0].id, status: "PENDING" },
  });

  return NextResponse.json({
    id: existing.id,
    userId,
    questId: params.questId,
    status: "IN_PROGRESS",
    taskProgress: [{ taskId: quest.tasks[0].id, status: "PENDING" }],
    firstCompletedAt: existing.firstCompletedAt,
    isReplay: true,
  });
}
