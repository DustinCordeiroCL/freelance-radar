import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAnthropicClient, NoApiKeyError } from "@/lib/anthropic";
import { resolveAnthropicKey } from "@/lib/keys";
import { getProfileContext } from "@/lib/profile";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!checkRateLimit(`proposal:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests — try again in a minute" }, { status: 429 });
  }

  const headerKey = request.headers.get("x-anthropic-key");
  const apiKey = resolveAnthropicKey(headerKey);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Configura una clave de API de Anthropic en Configuración para generar propuestas." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectId } = body as { projectId?: string };
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    const client = getAnthropicClient(apiKey);
    const profileContext = await getProfileContext();

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are an expert in writing freelance proposals.\n" +
        "CRITICAL: Detect the language of the project title and description, then write the entire proposal in that SAME language.\n" +
        "If the project is in Spanish → respond in Spanish. If Portuguese → Portuguese. If English → English.\n" +
        "Maximum 300 words. Tone: confident, direct, no clichés.\n" +
        "Return only the proposal text, nothing else.",
      messages: [
        {
          role: "user",
          content:
            `Developer profile:\n${profileContext}\n\n` +
            `Project:\n` +
            `Title: ${project.title}\n` +
            `Description: ${project.description}\n` +
            `Tags: ${project.tags ?? "none"}\n` +
            `Budget: ${project.budget ?? "not specified"}`,
        },
      ],
    });

    const proposalText = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ proposalText });
  } catch (err) {
    if (err instanceof NoApiKeyError) {
      return NextResponse.json(
        { error: "Configura una clave de API de Anthropic en Configuración para generar propuestas." },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    if (process.env.NODE_ENV !== "production") console.error("[api/proposal] AI generation failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
