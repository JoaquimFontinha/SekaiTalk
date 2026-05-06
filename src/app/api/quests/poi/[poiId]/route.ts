import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { poiId: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  const quests = await prisma.quest.findMany({
    where: { poiId: params.poiId, isActive: true },
    orderBy: { order: "asc" },
    include: {
      tasks: {
        orderBy: { order: "asc" },
        include: {
          choices: { orderBy: { order: "asc" } },
        },
      },
      userProgress: userId
        ? {
            where: { userId },
            include: {
              taskProgress: {
                select: { taskId: true, status: true },
              },
            },
          }
        : false,
    },
  });

  return NextResponse.json(quests);
}
