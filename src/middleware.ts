// TEMPORARY: Gate middleware — blocks site during development.
// To remove: delete this file and replace with the original withAuth-only version.

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// SHA-256 hash of the gate password (password itself is never stored here)
const GATE_COOKIE = "__gate";
const GATE_TOKEN = "a81ee869be78a8bf38b0e1bb2559fd5685859858cb8bc524fa31038be32355c9";

const GATE_EXEMPT = ["/coming-soon", "/api/auth/gate", "/api/auth/"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Gate check — block access unless cookie matches
  const isExempt = GATE_EXEMPT.some((p) => pathname.startsWith(p));
  if (!isExempt) {
    const gate = req.cookies.get(GATE_COOKIE)?.value;
    if (gate !== GATE_TOKEN) {
      const url = req.nextUrl.clone();
      url.pathname = "/coming-soon";
      return NextResponse.redirect(url);
    }
  }

  // Admin-only routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!(token as any)?.isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, public static dirs, and files with extensions
    "/((?!_next/static|_next/image|favicon\\.ico|images|sounds|models|uploads|.*\\.\\w+$).*)",
  ],
};
