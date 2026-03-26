import { NextResponse } from "next/server";
import { runCollection } from "@/connectors";

export async function POST(): Promise<NextResponse> {
  try {
    const results = await runCollection();
    const totalSaved = results.reduce((sum, r) => sum + r.saved, 0);

    return NextResponse.json({ success: true, results, totalSaved });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/collect] Unexpected error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
