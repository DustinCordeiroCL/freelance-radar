import { NextRequest, NextResponse } from "next/server";

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Rotas de API públicas (não exigem sessão)
const PUBLIC_API = ["/api/auth"];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Apenas protege rotas de API (a UI é protegida pelo AuthGuard no layout)
  if (!pathname.startsWith("/api/")) return NextResponse.next();
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const appSecret = process.env.APP_SECRET?.trim();
  if (!appSecret) return NextResponse.next(); // sem secret = dev local aberto

  const session = request.cookies.get("fr_session")?.value;
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = await hashSecret(appSecret);
  if (session !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
