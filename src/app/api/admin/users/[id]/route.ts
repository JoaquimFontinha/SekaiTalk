import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any).isAdmin) return false;
  return true;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await checkAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { isAdmin } = await req.json();
  const user = await prisma.user.update({
    where: { id: params.id },
    data: { isAdmin },
    select: { id: true, email: true, name: true, isAdmin: true },
  });
  return NextResponse.json(user);
}
