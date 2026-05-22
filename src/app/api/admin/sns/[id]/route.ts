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
  const conv = await prisma.snsConversation.findUnique({ where: { id: params.id } });
  if (!conv) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(conv);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { createdAt: _ca, updatedAt: _ua, ...body } = await req.json();
  const conv = await prisma.snsConversation.update({ where: { id: params.id }, data: body });
  return NextResponse.json(conv);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.snsConversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
