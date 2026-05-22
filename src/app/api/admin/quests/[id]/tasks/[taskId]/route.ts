import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function PUT(req: Request, { params }: { params: { id: string; taskId: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id: _id, questId: _qid, quest: _q, choices: _c, userProgress: _up, createdAt: _ca, ...data } = body;
  const task = await prisma.questTask.update({ where: { id: params.taskId }, data });
  return NextResponse.json(task);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; taskId: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.questTask.delete({ where: { id: params.taskId } });
  return NextResponse.json({ ok: true });
}
