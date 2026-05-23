import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type IntroData = { word: string; kana: string; romaji: string; translation: string; jlpt?: number };

export async function POST(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  const { score, durationSeconds }: { score: number; durationSeconds?: number } = await req.json();
  const validated = score >= 80;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id ?? null;

  if (!userId) return NextResponse.json({ validated, score });

  if (durationSeconds && durationSeconds > 0) {
    await prisma.practiceRecord.create({
      data: { userId, type: "lesson", durationSeconds },
    });
  }

  const now = new Date();
  const existing = await prisma.userLessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId: params.lessonId } },
  });

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: params.lessonId } },
    update: {
      score,
      validated:        existing?.validated || validated,
      completedAt:      now,
      firstValidatedAt: existing?.firstValidatedAt ?? (validated ? now : null),
    },
    create: {
      userId,
      lessonId:         params.lessonId,
      score,
      validated,
      completedAt:      now,
      firstValidatedAt: validated ? now : null,
    },
  });

  // Register all INTRO step words into vocab progress
  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    include: { steps: { where: { type: "INTRO" }, orderBy: { order: "asc" } } },
  });

  for (const step of lesson?.steps ?? []) {
    const d = step.data as IntroData;
    if (!d.word) continue;

    await prisma.userVocabProgress.upsert({
      where: { userId_wordJp: { userId, wordJp: d.word } },
      update: {}, // Preserve existing progress — don't overwrite if already tracked from a quest
      create: {
        userId,
        lessonId:     params.lessonId,
        wordJp:       d.word,
        kana:         d.kana   ?? d.word,
        romaji:       d.romaji ?? "",
        fr:           d.translation ?? "",
        jlpt:         d.jlpt  ?? 5,
        encounters:   1,
        correctCount: 0,
        errorCount:   0,
      },
    });
  }

  return NextResponse.json({ validated, score });
}
