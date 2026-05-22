import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { order, instruction, aiContext, suggestions } = await req.json();
  const task = await prisma.questTask.create({
    data: {
      questId: params.id,
      order: order ?? 0,
      instruction,
      aiContext,
      suggestions: suggestions ?? [],
    },
  });
  return NextResponse.json(task, { status: 201 });
}
