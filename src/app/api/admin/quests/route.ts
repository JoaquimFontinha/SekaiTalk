import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const quests = await prisma.quest.findMany({
    include: { tasks: { select: { id: true } } },
    orderBy: [{ poiId: "asc" }, { order: "asc" }],
  });
  const result = quests.map((q) => ({ ...q, taskCount: q.tasks.length }));
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { tasks: _t, userProgress: _up, vocabProgress: _vp, sessionRecords: _sr, ...data } = body;
  const quest = await prisma.quest.create({ data });
  return NextResponse.json(quest, { status: 201 });
}
