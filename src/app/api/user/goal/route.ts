import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyGoalMinutes: true },
  });
  const dailyGoalMinutes = user?.dailyGoalMinutes ?? 10;

  // Current week bounds (Mon–Sun UTC)
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const diffToMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - diffToMon);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 7);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const records = await prisma.practiceRecord.findMany({
    where: { userId, createdAt: { gte: monday, lt: sunday } },
    select: { durationSeconds: true, createdAt: true },
  });

  const weeklySeconds = records.reduce((s, r) => s + r.durationSeconds, 0);
  const weeklyMinutes = Math.round(weeklySeconds / 60);

  const todaySeconds = records
    .filter(r => r.createdAt >= todayStart && r.createdAt < todayEnd)
    .reduce((s, r) => s + r.durationSeconds, 0);
  const todayMinutes = Math.round(todaySeconds / 60);

  // activeDays[0]=Mon … activeDays[6]=Sun
  const activeDays = Array(7).fill(false) as boolean[];
  for (const r of records) {
    const d = r.createdAt.getUTCDay();
    activeDays[d === 0 ? 6 : d - 1] = true;
  }

  return NextResponse.json({ dailyGoalMinutes, weeklyMinutes, todayMinutes, activeDays });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { dailyGoalMinutes } = await req.json();
  const clamped = Math.min(30, Math.max(5, Number(dailyGoalMinutes) || 10));

  await prisma.user.update({ where: { id: userId }, data: { dailyGoalMinutes: clamped } });
  return NextResponse.json({ dailyGoalMinutes: clamped });
}
