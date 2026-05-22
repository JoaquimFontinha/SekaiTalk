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
  const lessons = await prisma.lesson.findMany({
    include: {
      steps: { select: { id: true } },
    },
    orderBy: { poiId: "asc" },
  });
  // Try to enrich with POI name from POIRecord
  const poiIds = lessons.map((l) => l.poiId);
  const poiRecords = await prisma.pOIRecord.findMany({
    where: { id: { in: poiIds } },
    select: { id: true, name: true, cityId: true },
  });
  const poiMap = Object.fromEntries(poiRecords.map((p) => [p.id, p]));
  const result = lessons.map((l) => ({
    ...l,
    stepCount: l.steps.length,
    poiName: poiMap[l.poiId]?.name ?? l.poiId,
    cityId: poiMap[l.poiId]?.cityId ?? null,
  }));
  return NextResponse.json(result);
}
