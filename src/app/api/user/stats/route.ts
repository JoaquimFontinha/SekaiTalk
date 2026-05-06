import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLevelInfo } from "@/lib/levels";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, yens: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { level, xpInLevel, xpNeeded, percent } = getLevelInfo(user.xp);
  return NextResponse.json({ xp: user.xp, yens: user.yens, level, xpInLevel, xpNeeded, percent });
}
