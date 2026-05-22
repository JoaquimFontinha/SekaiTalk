import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function POST(req: Request) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { poiId, title, description } = await req.json();
  if (!poiId || !title) return NextResponse.json({ error: "poiId and title required" }, { status: 400 });
  const lesson = await prisma.lesson.create({ data: { poiId, title, description } });
  return NextResponse.json(lesson, { status: 201 });
}
