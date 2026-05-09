import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import cities from "@/lib/cities";

// Build a poiId → name lookup from the static city data
const POI_NAMES: Record<string, string> = {};
Object.values(cities).forEach(city =>
  city.pois.forEach(poi => { POI_NAMES[poi.id] = poi.name; })
);

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = ((session?.user as any)?.id as string | undefined) ?? null;

  const [characters, memoryCounts] = await Promise.all([
    prisma.character.findMany({
      where: { isFriendable: true, isActive: true },
      select: {
        id:      true,
        name:    true,
        nameJp:  true,
        role:    true,
        image:   true,
        appearances: { select: { poiId: true } },
      },
      orderBy: { name: "asc" },
    }),
    userId
      ? prisma.characterMemory.groupBy({
          by: ["characterId"],
          where: { userId },
          _count: { id: true },
        })
      : Promise.resolve([] as { characterId: string; _count: { id: number } }[]),
  ]);

  const memMap: Record<string, number> = {};
  memoryCounts.forEach(m => { memMap[m.characterId] = m._count.id; });

  return NextResponse.json(
    characters.map(c => ({
      id:          c.id,
      name:        c.name,
      nameJp:      c.nameJp,
      role:        c.role,
      image:       c.image,
      memoryCount: memMap[c.id] ?? 0,
      locations:   c.appearances.map(a => ({
        poiId: a.poiId,
        name:  POI_NAMES[a.poiId] ?? a.poiId,
      })),
    }))
  );
}
