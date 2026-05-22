import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items: { id: string; order: number }[] = await req.json();
  await Promise.all(
    items.map((item) =>
      prisma.lessonStep.update({ where: { id: item.id }, data: { order: item.order } })
    )
  );
  return NextResponse.json({ ok: true });
}
