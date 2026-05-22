import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const quest = await prisma.quest.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: { choices: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!quest) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quest);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id: _id, tasks: _t, userProgress: _up, vocabProgress: _vp, sessionRecords: _sr, createdAt: _ca, updatedAt: _ua, ...data } = body;
  const quest = await prisma.quest.update({ where: { id: params.id }, data });
  return NextResponse.json(quest);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.quest.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
