import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMastery } from "@/lib/mastery";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const body = await req.json() as {
    questId:        string;
    durationSeconds: number;
    errorCount:     number;
    suggestionsUsed: number;
    practicedWords: string[]; // jp fields of detected vocab
  };

  const { questId, durationSeconds, errorCount, suggestionsUsed, practicedWords } = body;

  // Persist session record (even for guests, skip if no userId)
  if (userId) {
    await prisma.sessionRecord.create({
      data: {
        userId,
        questId,
        durationSeconds,
        errorCount,
        suggestionsUsed,
        practicedWords,
      },
    });

    // Upsert vocab progress for each practiced word
    for (const wordJp of practicedWords) {
      const existing = await prisma.userVocabProgress.findUnique({
        where: { userId_questId_wordJp: { userId, questId, wordJp } },
      });

      if (existing) {
        const newEncounters   = existing.encounters + 1;
        const newCorrectCount = existing.correctCount + Math.max(0, 1 - errorCount / Math.max(practicedWords.length, 1));
        await prisma.userVocabProgress.update({
          where: { userId_questId_wordJp: { userId, questId, wordJp } },
          data: {
            encounters:   newEncounters,
            correctCount: Math.round(newCorrectCount),
            lastSeenAt:   new Date(),
          },
        });
      } else {
        await prisma.userVocabProgress.create({
          data: { userId, questId, wordJp, encounters: 1, correctCount: 1, errorCount: 0 },
        });
      }
    }
  }

  // Fetch quest vocab + current progress to compute mastery for summary
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  const vocabEntries = (quest?.vocab ?? []) as Array<{ jp: string; kana: string; romaji: string; fr: string; jlpt: number }>;

  const progressRows = userId
    ? await prisma.userVocabProgress.findMany({ where: { userId, questId } })
    : [];

  const progressMap = new Map(progressRows.map(r => [r.wordJp, r]));

  const vocabWithMastery = vocabEntries.map(v => {
    const p = progressMap.get(v.jp);
    return {
      ...v,
      mastery:      computeMastery(p?.encounters ?? 0, p?.correctCount ?? 0, p?.errorCount ?? 0),
      encounters:   p?.encounters ?? 0,
      correctCount: p?.correctCount ?? 0,
      errorCount:   p?.errorCount ?? 0,
      practiced:    practicedWords.includes(v.jp),
    };
  });

  return NextResponse.json({ vocabWithMastery });
}
