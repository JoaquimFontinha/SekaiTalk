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
  const convs = await prisma.snsConversation.findMany({
    orderBy: [{ poiId: "asc" }],
  });
  return NextResponse.json(convs);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, poiId, title, context, xpReward, contact, steps, isActive } = body;
  if (!id || !poiId || !title) return NextResponse.json({ error: "id, poiId et title requis" }, { status: 400 });
  const conv = await prisma.snsConversation.create({
    data: { id, poiId, title, context: context ?? "", xpReward: xpReward ?? 30, contact, steps: steps ?? [], isActive: isActive ?? true },
  });
  return NextResponse.json(conv, { status: 201 });
}
