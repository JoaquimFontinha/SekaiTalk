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
  const character = await prisma.character.findUnique({
    where: { id: params.id },
    include: { appearances: true },
  });
  if (!character) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(character);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id: _id, appearances: _a, memories: _m, createdAt: _ca, updatedAt: _ua, ...data } = body;
  const character = await prisma.character.update({ where: { id: params.id }, data });
  return NextResponse.json(character);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.character.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// PATCH — manage appearances
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { action, poiId, locationContext } = await req.json();

  if (action === "add_appearance") {
    const appearance = await prisma.characterAppearance.upsert({
      where: { characterId_poiId: { characterId: params.id, poiId } },
      update: { locationContext },
      create: { characterId: params.id, poiId, locationContext },
    });
    return NextResponse.json(appearance);
  }

  if (action === "remove_appearance") {
    await prisma.characterAppearance.deleteMany({
      where: { characterId: params.id, poiId },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
