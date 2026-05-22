import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { poiId: string } }) {
  const conv = await prisma.snsConversation.findFirst({
    where: { poiId: params.poiId, isActive: true },
  });
  if (!conv) return NextResponse.json(null);
  return NextResponse.json(conv);
}
