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

  const [cityRecords, poiRecords, scenes, characters, appearances, quests, lessons] = await Promise.all([
    prisma.cityRecord.findMany({ orderBy: { levelRequired: "asc" } }),
    prisma.pOIRecord.findMany({ orderBy: [{ cityId: "asc" }, { name: "asc" }] }),
    prisma.scene.findMany(),
    prisma.character.findMany({ include: { appearances: true } }),
    prisma.characterAppearance.findMany(),
    prisma.quest.findMany({
      include: {
        tasks: {
          orderBy: { order: "asc" },
          include: { choices: { orderBy: { order: "asc" } } },
        },
      },
      orderBy: [{ poiId: "asc" }, { order: "asc" }],
    }),
    prisma.lesson.findMany({
      include: { steps: { orderBy: { order: "asc" } } },
    }),
  ]);

  const payload = { cityRecords, poiRecords, scenes, characters, appearances, quests, lessons };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="sekai-content.json"`,
    },
  });
}
