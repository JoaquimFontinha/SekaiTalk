import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function POST(req: Request, { params }: { params: { id: string; taskId: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { text, isCorrect, order } = await req.json();
  const choice = await prisma.taskChoice.create({
    data: { taskId: params.taskId, text, isCorrect: isCorrect ?? false, order: order ?? 0 },
  });
  return NextResponse.json(choice, { status: 201 });
}

// PUT — batch update all choices for a task (replaces existing)
export async function PUT(req: Request, { params }: { params: { id: string; taskId: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const choices: { text: string; isCorrect: boolean; order: number }[] = await req.json();
  // Delete existing and recreate
  await prisma.taskChoice.deleteMany({ where: { taskId: params.taskId } });
  const created = await prisma.taskChoice.createMany({
    data: choices.map((c) => ({ taskId: params.taskId, text: c.text, isCorrect: c.isCorrect ?? false, order: c.order ?? 0 })),
  });
  return NextResponse.json({ count: created.count });
}
