import { NextRequest, NextResponse } from "next/server";

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

  const raw = body as Record<string, unknown>;
  const password = (raw?.password ?? raw?.secret) as string | undefined;

  if (typeof password !== "string" || password !== appSecret) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("fr_session", appSecret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
