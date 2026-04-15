import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API = ["/api/auth"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const appSecret = process.env.APP_SECRET?.trim();
  if (!appSecret) return NextResponse.next();

  const session = request.cookies.get("fr_session")?.value;
  if (!session || session !== appSecret) {
    return NextResponse.json({ error: "Sessão expirada — faça login novamente" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
