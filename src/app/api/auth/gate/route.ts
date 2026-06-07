// TEMPORARY: Gate password check — remove when site goes public.

import { NextResponse } from "next/server";
import { createHash } from "crypto";

const GATE_COOKIE = "__gate";
const GATE_TOKEN = "a81ee869be78a8bf38b0e1bb2559fd5685859858cb8bc524fa31038be32355c9";

export async function POST(req: Request) {
  const { password } = await req.json();
  const hash = createHash("sha256")
    .update(String(password ?? ""))
    .digest("hex");

  if (hash !== GATE_TOKEN) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(GATE_COOKIE, GATE_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
  return res;
}
