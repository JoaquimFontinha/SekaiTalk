/**
 * Server-side helper: charge les données ville+POI depuis la DB (CityRecord + POIRecord).
 * Retourne le même format que cities.ts pour une compatibilité totale.
 * Falls back aux données statiques si la ville n'est pas en DB.
 */

import { prisma } from "@/lib/prisma";
import staticCities, { type CityData, type POI, type POIType } from "@/lib/cities";

function dbToCity(
  cr: {
    id: string; name: string; nameJp: string;
    centerLat: number; centerLng: number;
    zoom: number; levelRequired: number;
    use3DMap: boolean; mapImage: string | null; mapBoundsJson: string | null;
    isActive: boolean;
  },
  pois: Array<{
    id: string; name: string; type: string;
    lat: number; lng: number; description: string | null; logoPath: string | null;
    isActive: boolean;
  }>
): CityData {
  return {
    name: cr.name,
    center: [cr.centerLat, cr.centerLng],
    zoom: cr.zoom,
    levelRequired: cr.levelRequired,
    use3DMap: cr.use3DMap,
    mapImage: cr.mapImage ?? undefined,
    mapBounds: cr.mapBoundsJson ? JSON.parse(cr.mapBoundsJson) : undefined,
    pois: pois
      .filter(p => p.isActive)
      .map(p => ({
        id: p.id,
        name: p.name,
        type: p.type as POIType,
        lat: p.lat,
        lng: p.lng,
        description: p.description ?? undefined,
        image: p.logoPath ?? undefined,
      })),
  };
}

/** Charge une ville depuis la DB. Fallback sur cities.ts si absente. */
export async function getCityFromDB(slug: string): Promise<CityData | null> {
  const cr = await prisma.cityRecord.findUnique({
    where: { id: slug },
    include: { pois: { orderBy: { name: "asc" } } },
  });
  if (!cr) return staticCities[slug] ?? null;
  return dbToCity(cr, cr.pois);
}

/** Charge toutes les villes depuis la DB (pour la carte Japon, le layout). */
export async function getAllCitiesFromDB(): Promise<Record<string, CityData>> {
  const records = await prisma.cityRecord.findMany({
    include: { pois: { orderBy: { name: "asc" } } },
    orderBy: { levelRequired: "asc" },
  });

  const result: Record<string, CityData> = {};
  for (const cr of records) {
    result[cr.id] = dbToCity(cr, cr.pois);
  }

  // Fallback: villes présentes dans cities.ts mais absentes de la DB
  for (const [slug, data] of Object.entries(staticCities)) {
    if (!result[slug]) result[slug] = data;
  }

  return result;
}
