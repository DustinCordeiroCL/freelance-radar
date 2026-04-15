import { NextRequest, NextResponse } from "next/server";
import { runCollection } from "@/connectors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!checkRateLimit("collect:global", 5, 5 * 60_000)) {
    return NextResponse.json({ error: "Collection is cooling down — try again in a few minutes" }, { status: 429 });
  }
  const apiKey = request.headers.get("x-anthropic-key") ?? "";
  try {
    const results = await runCollection(apiKey);
    const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);
    return NextResponse.json({ success: true, results, totalSaved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") console.error("[api/collect] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
