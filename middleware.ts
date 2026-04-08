import { NextRequest, NextResponse } from "next/server";

const PUBLIC_API_ROUTES = new Set(["/api/auth/login", "/api/auth/status"]);

export function middleware(request: NextRequest): NextResponse {
  const appSecret = process.env.APP_SECRET;

  // No secret configured = local dev mode, allow everything
  if (!appSecret) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Always allow auth endpoints through
  if (PUBLIC_API_ROUTES.has(pathname)) return NextResponse.next();

  // For API routes, check cookie or header
  if (pathname.startsWith("/api/")) {
    const cookieSession = request.cookies.get("app_session")?.value;
    const headerSecret = request.headers.get("x-app-secret");

    if (cookieSession === appSecret || headerSecret === appSecret) {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
