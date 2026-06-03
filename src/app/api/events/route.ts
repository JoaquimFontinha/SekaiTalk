import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllCitiesFromDB } from "@/lib/cities-db";
import type { ActiveEvent, EventsResponse } from "@/lib/events";

export const dynamic = "force-dynamic";

// Vérifie si un event saisonnier est actif selon la date actuelle (récurrent chaque année)
function isSeasonalActive(startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const now = new Date();
  const m = now.getMonth() + 1; // 1-12
  const d = now.getDate();
  const start = startMonth * 100 + startDay;
  const end   = endMonth   * 100 + endDay;
  const cur   = m * 100 + d;
  if (start <= end) return cur >= start && cur <= end;
  return cur >= start || cur <= end; // plage qui traverse le 31 déc
}

// Génère 1-2 events quotidiens depuis les templates si nécessaire (lazy generation)
async function ensureDailyEvents(): Promise<void> {
  const now = new Date();
  const existingCount = await prisma.event.count({
    where: { type: "DAILY_INSTANCE", isActive: true, endAt: { gt: now } },
  });
  if (existingCount >= 2) return;

  const usedTemplateIds = await prisma.event
    .findMany({ where: { type: "DAILY_INSTANCE", isActive: true, endAt: { gt: now } }, select: { templateId: true } })
    .then(rows => rows.map(r => r.templateId).filter(Boolean) as string[]);

  const templates = await prisma.event.findMany({
    where: {
      type: "DAILY_TEMPLATE",
      isActive: true,
      ...(usedTemplateIds.length ? { id: { notIn: usedTemplateIds } } : {}),
    },
  });
  if (!templates.length) return;

  const needed   = 2 - existingCount;
  const picks    = [...templates].sort(() => Math.random() - 0.5).slice(0, needed);
  const todayStr = now.toISOString().slice(0, 10);
  const endAt    = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // upsert idempotent (si la même journée est appellée deux fois en parallèle)
  await prisma.$transaction(
    picks.map(t =>
      prisma.event.upsert({
        where:  { id: `daily-${t.id}-${todayStr}` },
        update: {},
        create: {
          id: `daily-${t.id}-${todayStr}`,
          type: "DAILY_INSTANCE",
          title: t.title, description: t.description,
          poiId: t.poiId, xpReward: t.xpReward,
          emoji: t.emoji, color: t.color,
          questId: t.questId, lessonId: t.lessonId,
          imageUrl: t.imageUrl,
          isActive: true, templateId: t.id,
          startAt: now, endAt,
        },
      })
    )
  );
}

export async function GET(): Promise<NextResponse<EventsResponse>> {
  try {
    await ensureDailyEvents();

    const now = new Date();

    const [seasonalRaw, dailyRaw, allCities] = await Promise.all([
      prisma.event.findMany({ where: { type: "SEASONAL",       isActive: true } }),
      prisma.event.findMany({ where: { type: "DAILY_INSTANCE", isActive: true, endAt: { gt: now } } }),
      getAllCitiesFromDB(),
    ]);

    // Index poiId → nom depuis toutes les villes
    const poiNameMap: Record<string, string> = {};
    for (const city of Object.values(allCities)) {
      for (const poi of city.pois) {
        poiNameMap[poi.id] = poi.name;
      }
    }

    const currentYear = now.getFullYear();

    const toActiveEvent = (e: typeof seasonalRaw[0], isSeasonal: boolean): ActiveEvent => {
      let expiresAt: Date;
      if (isSeasonal && e.endMonth && e.endDay) {
        expiresAt = new Date(currentYear, e.endMonth - 1, e.endDay, 23, 59, 59);
        if (expiresAt < now) {
          expiresAt = new Date(currentYear + 1, e.endMonth - 1, e.endDay, 23, 59, 59);
        }
      } else {
        expiresAt = e.endAt ?? new Date(now.getTime() + 86_400_000);
      }
      return {
        id: e.id, type: isSeasonal ? "SEASONAL" : "DAILY_INSTANCE",
        title: e.title, description: e.description,
        poiId: e.poiId,
        poiName: poiNameMap[e.poiId] ?? e.poiId,
        emoji: e.emoji, color: e.color,
        xpReward: e.xpReward,
        questId: e.questId ?? null,
        lessonId: e.lessonId ?? null,
        imageUrl: e.imageUrl ?? null,
        expiresAt: expiresAt.toISOString(),
      };
    };

    const seasonal = seasonalRaw
      .filter(e => e.startMonth && e.startDay && e.endMonth && e.endDay
        && isSeasonalActive(e.startMonth, e.startDay, e.endMonth, e.endDay))
      .map(e => toActiveEvent(e, true));

    const daily = dailyRaw.map(e => toActiveEvent(e, false));

    return NextResponse.json({ seasonal, daily });
  } catch (err) {
    console.error("GET /api/events", err);
    return NextResponse.json({ seasonal: [], daily: [] });
  }
}
