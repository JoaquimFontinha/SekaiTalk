import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return null;
  return session;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    title, description, poiId, type,
    startMonth, startDay, endMonth, endDay,
    startAt, endAt,
    xpReward, emoji, color, imageUrl,
    questId, lessonId, isActive,
  } = body;

  const event = await prisma.event.update({
    where: { id: params.id },
    data: {
      ...(title       !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(poiId       !== undefined && { poiId }),
      ...(type        !== undefined && { type }),
      ...(startMonth  !== undefined && { startMonth }),
      ...(startDay    !== undefined && { startDay }),
      ...(endMonth    !== undefined && { endMonth }),
      ...(endDay      !== undefined && { endDay }),
      ...(startAt     !== undefined && { startAt: startAt ? new Date(startAt) : null }),
      ...(endAt       !== undefined && { endAt:   endAt   ? new Date(endAt)   : null }),
      ...(xpReward    !== undefined && { xpReward }),
      ...(emoji       !== undefined && { emoji }),
      ...(color       !== undefined && { color }),
      ...(imageUrl    !== undefined && { imageUrl }),
      ...(questId     !== undefined && { questId }),
      ...(lessonId    !== undefined && { lessonId }),
      ...(isActive    !== undefined && { isActive }),
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
