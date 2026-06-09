import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { poiId: string } }) {
  const scene = await prisma.scene.findUnique({
    where: { poiId: params.poiId },
    select: { backgroundImage: true },
  });
  return NextResponse.json({ backgroundImage: scene?.backgroundImage ?? null });
}
