import { NextRequest, NextResponse } from "next/server";

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const PUBLIC_PREFIXES = ["/login", "/api/auth"];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const appSecret = process.env.APP_SECRET?.trim();
  if (!appSecret) return NextResponse.next(); // sem secret configurado → aberto

  const session = request.cookies.get("fr_session")?.value;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const expected = await hashSecret(appSecret);
  if (session !== expected) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("fr_session");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
