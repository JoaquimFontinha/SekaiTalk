import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { poiId: string } }
) {
  const { poiId } = params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const [scene, snsConversation, quests, lesson] = await Promise.all([
    prisma.scene.findUnique({
      where: { poiId },
      select: { backgroundImage: true },
    }),
    prisma.snsConversation.findFirst({
      where: { poiId, isActive: true },
    }),
    prisma.quest.findMany({
      where: { poiId, isActive: true },
      orderBy: { order: "asc" },
      include: {
        tasks: {
          orderBy: { order: "asc" },
          select: { id: true, order: true },
        },
        userProgress: userId
          ? {
              where: { userId },
              include: {
                taskProgress: { select: { taskId: true, status: true } },
              },
            }
          : false,
      },
    }),
    prisma.lesson.findUnique({
      where: { poiId },
      select: {
        id: true,
        title: true,
        ...(userId
          ? {
              progress: {
                where: { userId },
                take: 1,
                select: { validated: true, score: true },
              },
            }
          : {}),
      },
    }),
  ]);

  let lessonResult: { id: string; title: string; validated: boolean; score: number } | null = null;
  if (lesson) {
    const { progress, ...rest } = lesson as typeof lesson & { progress?: { validated: boolean; score: number }[] };
    const prog = progress?.[0] ?? null;
    lessonResult = {
      id: rest.id,
      title: rest.title,
      validated: prog?.validated ?? false,
      score: prog?.score ?? 0,
    };
  }

  return NextResponse.json({
    backgroundImage: scene?.backgroundImage ?? null,
    snsConversation: snsConversation ?? null,
    quests,
    lesson: lessonResult,
  });
}
