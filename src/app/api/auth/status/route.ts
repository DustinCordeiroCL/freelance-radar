import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const appSecret = process.env.APP_SECRET?.trim();

  if (!appSecret) {
    return NextResponse.json({ authRequired: false, authenticated: true });
  }

  const session = request.cookies.get("fr_session")?.value;
  return NextResponse.json({
    authRequired: true,
    authenticated: !!session && session === appSecret,
  });
}
