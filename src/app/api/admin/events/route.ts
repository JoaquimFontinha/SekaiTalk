import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function GET() {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const events = await prisma.event.findMany({ orderBy: [{ type: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    id, type, title, description, poiId,
    startMonth, startDay, endMonth, endDay,
    xpReward, emoji, color, imageUrl,
    questId, lessonId, isActive,
  } = body;

  if (!id || !type || !title || !poiId) {
    return NextResponse.json({ error: "id, type, title, poiId requis" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      id, type, title, description: description ?? "",
      poiId, startMonth, startDay, endMonth, endDay,
      xpReward: xpReward ?? 50,
      emoji: emoji ?? "🎉",
      color: color ?? "#6366f1",
      imageUrl: imageUrl ?? null,
      questId: questId ?? null,
      lessonId: lessonId ?? null,
      isActive: isActive !== false,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
