import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { score }: { score: number } = await req.json();
  const validated = score >= 80;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id ?? null;

  if (!userId) return NextResponse.json({ validated, score });

  const existing = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: params.lessonId } },
  });

  const now = new Date();
  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: params.lessonId } },
    update: {
      score,
      validated: existing?.validated || validated,
      completedAt: now,
      firstValidatedAt: existing?.firstValidatedAt ?? (validated ? now : null),
    },
    create: {
      userId,
      lessonId: params.lessonId,
      score,
      validated,
      completedAt: now,
      firstValidatedAt: validated ? now : null,
    },
  });

  return NextResponse.json({ validated, score });
}
