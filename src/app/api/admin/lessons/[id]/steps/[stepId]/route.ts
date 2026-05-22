import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StepType } from "@prisma/client";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function PUT(req: Request, { params }: { params: { id: string; stepId: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id: _id, lessonId: _lid, ...data } = body;
  if (data.type) data.type = data.type as StepType;
  const step = await prisma.lessonStep.update({ where: { id: params.stepId }, data });
  return NextResponse.json(step);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; stepId: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.lessonStep.delete({ where: { id: params.stepId } });
  return NextResponse.json({ ok: true });
}
