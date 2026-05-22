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
  const cities = await prisma.cityRecord.findMany({
    include: { pois: { select: { id: true } } },
    orderBy: { levelRequired: "asc" },
  });
  return NextResponse.json(cities);
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const city = await prisma.cityRecord.create({ data: body });
  return NextResponse.json(city, { status: 201 });
}
