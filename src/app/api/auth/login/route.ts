import { NextRequest, NextResponse } from "next/server";

async function hashSecret(secret: string): Promise<string> {
  const data = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const appSecret = process.env.APP_SECRET?.trim();

  if (!appSecret) {
    return NextResponse.json({ ok: true, authRequired: false });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const password = (body as Record<string, unknown>)?.password;

  if (typeof password !== "string" || password !== appSecret) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }

  const token = await hashSecret(appSecret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set("fr_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
