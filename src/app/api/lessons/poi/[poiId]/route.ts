import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { poiId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id ?? null;

  const lesson = await prisma.lesson.findUnique({
    where: { poiId: params.poiId },
    include: {
      steps: { orderBy: { order: "asc" } },
      ...(userId ? { progress: { where: { userId }, take: 1 } } : {}),
    },
  });

  if (!lesson) return NextResponse.json(null);

  const { progress, ...rest } = lesson as typeof lesson & { progress?: unknown[] };
  return NextResponse.json({
    ...rest,
    userProgress: (progress as { score: number; validated: boolean; completedAt: Date | null }[])?.[0] ?? null,
  });
}
