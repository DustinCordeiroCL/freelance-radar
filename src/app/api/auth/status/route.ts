import { NextRequest, NextResponse } from "next/server";

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const appSecret = process.env.APP_SECRET?.trim();

  if (!appSecret) {
    return NextResponse.json({ authRequired: false, authenticated: true });
  }

  const session = request.cookies.get("fr_session")?.value;
  if (!session) {
    return NextResponse.json({ authRequired: true, authenticated: false });
  }

  const expected = await hashSecret(appSecret);
  return NextResponse.json({ authRequired: true, authenticated: session === expected });
}
