import { NextResponse } from "next/server";
import { collect as collectIndeed } from "@/connectors/indeed";
import { collect as collectSoyFreelancer } from "@/connectors/soyfreelancer";

export async function GET(): Promise<NextResponse> {
  const results: Record<string, { count: number; sample: string[]; error?: string }> = {};

  for (const [name, fn] of [
    ["indeed", () => collectIndeed()],
    ["soyfreelancer", () => collectSoyFreelancer(["desarrollo web", "programador"])],
  ] as const) {
    try {
      const projects = await fn();
      results[name] = {
        count: projects.length,
        sample: projects.slice(0, 3).map((p) => p.title),
      };
    } catch (err) {
      results[name] = {
        count: 0,
        sample: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(results);
}
