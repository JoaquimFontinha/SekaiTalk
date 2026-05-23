import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMastery, type VocabEntry } from "@/lib/mastery";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const body = await req.json() as {
    questId:         string;
    durationSeconds: number;
    errorCount:      number;
    suggestionsUsed: number;
    practicedWords:  string[]; // jp fields of detected vocab
  };

  const { questId, durationSeconds, errorCount, suggestionsUsed, practicedWords } = body;

  // Fetch quest vocab to register all words (not just spoken ones)
  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  const allVocab = (quest?.vocab ?? []) as VocabEntry[];
  const practicedSet = new Set(practicedWords);

  if (userId) {
    await Promise.all([
      prisma.sessionRecord.create({
        data: { userId, questId, durationSeconds, errorCount, suggestionsUsed, practicedWords },
      }),
      prisma.practiceRecord.create({
        data: { userId, type: "quest", durationSeconds },
      }),
    ]);

    // Register ALL quest vocab words — user was exposed to them
    for (const word of allVocab) {
      const wasPracticed = practicedSet.has(word.jp);
      const existing = await prisma.userVocabProgress.findUnique({
        where: { userId_wordJp: { userId, wordJp: word.jp } },
      });

      if (existing) {
        if (wasPracticed) {
          await prisma.userVocabProgress.update({
            where: { userId_wordJp: { userId, wordJp: word.jp } },
            data: { encounters: { increment: 1 }, correctCount: { increment: 1 }, lastSeenAt: new Date() },
          });
        }
        // Non-practiced existing word: leave untouched
      } else {
        // First time seeing this word
        await prisma.userVocabProgress.create({
          data: {
            userId,
            questId,
            wordJp:       word.jp,
            kana:         word.kana,
            romaji:       word.romaji,
            fr:           word.fr,
            jlpt:         word.jlpt,
            encounters:   1,
            correctCount: wasPracticed ? 1 : 0,
            errorCount:   0,
          },
        });
      }
    }
  }

  // Build summary with mastery for the quest vocab
  const progressRows = userId
    ? await prisma.userVocabProgress.findMany({
        where: { userId, wordJp: { in: allVocab.map(v => v.jp) } },
      })
    : [];

  const progressMap = new Map(progressRows.map(r => [r.wordJp, r]));

  const vocabWithMastery = allVocab.map(v => {
    const p = progressMap.get(v.jp);
    return {
      ...v,
      mastery:      computeMastery(p?.encounters ?? 0, p?.correctCount ?? 0, p?.errorCount ?? 0),
      encounters:   p?.encounters ?? 0,
      correctCount: p?.correctCount ?? 0,
      errorCount:   p?.errorCount ?? 0,
      practiced:    practicedSet.has(v.jp),
    };
  });

  return NextResponse.json({ vocabWithMastery });
}
