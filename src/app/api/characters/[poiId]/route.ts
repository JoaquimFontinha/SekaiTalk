import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { poiId: string } }
) {
  const { poiId } = params;

  const [appearance, scene] = await Promise.all([
    prisma.characterAppearance.findFirst({
      where: { poiId },
      include: { character: true },
    }),
    prisma.scene.findUnique({ where: { poiId } }),
  ]);

  if (!appearance) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...appearance.character,
    locationContext: appearance.locationContext ?? null,
    scene: scene ?? null,
  });
}
