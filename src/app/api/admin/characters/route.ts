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
  const characters = await prisma.character.findMany({
    include: { appearances: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(characters);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { appearances: _a, memories: _m, ...data } = body;
  const character = await prisma.character.create({ data });
  return NextResponse.json(character, { status: 201 });
}
