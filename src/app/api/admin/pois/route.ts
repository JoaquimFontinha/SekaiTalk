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
  const pois = await prisma.pOIRecord.findMany({
    include: { city: { select: { name: true } } },
    orderBy: [{ cityId: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(pois);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const poi = await prisma.pOIRecord.create({ data: body });
  return NextResponse.json(poi, { status: 201 });
}
