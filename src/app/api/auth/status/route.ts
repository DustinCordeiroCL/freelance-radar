import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const appSecret = process.env.APP_SECRET;

  // No secret configured — auth not required
  if (!appSecret) {
    return NextResponse.json({ authRequired: false, authenticated: true });
  }

  const cookieSession = request.cookies.get("app_session")?.value;
  const authenticated = cookieSession === appSecret;

  return NextResponse.json({ authRequired: true, authenticated });
}
