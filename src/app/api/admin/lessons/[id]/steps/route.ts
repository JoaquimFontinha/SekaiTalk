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

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { type, data, order } = await req.json();
  const step = await prisma.lessonStep.create({
    data: { lessonId: params.id, type: type as StepType, data, order },
  });
  return NextResponse.json(step, { status: 201 });
}
