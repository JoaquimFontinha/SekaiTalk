import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, pseudo, firstName, lastName, birthDate } =
      await req.json();

    if (!email || !password || !pseudo || !firstName || !lastName || !birthDate) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { pseudo }] },
    });

    if (existing?.email === email) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà utilisée." },
        { status: 409 }
      );
    }
    if (existing?.pseudo === pseudo) {
      return NextResponse.json(
        { error: "Ce pseudo est déjà pris." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        pseudo,
        firstName,
        lastName,
        birthDate: new Date(birthDate),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
