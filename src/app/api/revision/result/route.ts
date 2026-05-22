import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ResultItem = { wordJp: string; correct: boolean };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { results } = await req.json() as { results: ResultItem[] };

  await Promise.all(results.map(({ wordJp, correct }) =>
    prisma.userVocabProgress.update({
      where: { userId_wordJp: { userId, wordJp } },
      data: {
        encounters:   { increment: 1 },
        correctCount: correct  ? { increment: 1 } : undefined,
        errorCount:   !correct ? { increment: 1 } : undefined,
        lastSeenAt:   new Date(),
      },
    }).catch(() => {}) // ignore if word doesn't exist (shouldn't happen)
  ));

  return NextResponse.json({ ok: true });
}
