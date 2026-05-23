import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const { score, durationSeconds }: { score: number; durationSeconds?: number } = await req.json();

  if (!userId) return NextResponse.json({ xpAwarded: 0, isFirstCompletion: false });

  const conv = await prisma.snsConversation.findUnique({
    where: { id: params.id },
    select: { xpReward: true },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.userSnsProgress.findUnique({
    where: { userId_snsId: { userId, snsId: params.id } },
  });

  const isFirstCompletion = !existing;

  await prisma.userSnsProgress.upsert({
    where: { userId_snsId: { userId, snsId: params.id } },
    update: { score: Math.max(existing?.score ?? 0, score), completedAt: new Date() },
    create: { userId, snsId: params.id, score },
  });

  if (isFirstCompletion) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: conv.xpReward } },
    });
  }

  if (durationSeconds && durationSeconds > 0) {
    await prisma.practiceRecord.create({
      data: { userId, type: "sns", durationSeconds },
    });
  }

  return NextResponse.json({ xpAwarded: isFirstCompletion ? conv.xpReward : 0, isFirstCompletion });
}
