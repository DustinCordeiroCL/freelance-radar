import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { resolveAnthropicKey } from "@/lib/keys";

interface ParseResult {
  titles: string[];
  skills: string[];
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Import the internal module directly to avoid pdf-parse's test file loading
  // at webpack bundle time (known Next.js + pdf-parse v1 issue)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const headerKey = request.headers.get("x-anthropic-key");
  const apiKey = resolveAnthropicKey(headerKey);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Configura una clave de API de Anthropic en Configuración para analizar el currículum." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  let resumeText: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    resumeText = await extractTextFromPdf(buffer);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[api/profile/parse] PDF extraction failed:", detail);
    return NextResponse.json({ error: `Failed to read PDF content: ${detail}` }, { status: 422 });
  }

  if (!resumeText.trim()) {
    return NextResponse.json({ error: "Could not extract text from this PDF" }, { status: 422 });
  }

  try {
    const client = getAnthropicClient(apiKey);

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are a resume parser. Extract job titles and technical skills from a resume.\n" +
        "Return ONLY a valid JSON object with no extra text:\n" +
        "{ \"titles\": [\"...\"], \"skills\": [\"...\"] }\n" +
        "- titles: up to 5 job title variations this person could be hired for.\n" +
        "  For each title, include ALL THREE language versions as separate array items:\n" +
        "  Spanish, English, and Brazilian Portuguese.\n" +
        "  Example: ['Desarrollador Full Stack', 'Full Stack Developer', 'Desenvolvedor Full Stack']\n" +
        "  Do not group them — list each language variant as its own string in the array.\n" +
        "- skills: up to 30 specific technical skills (languages, frameworks, tools, databases).\n" +
        "  Always use the canonical English name for skills (e.g. 'React', not 'ReactJS' or 'React.js').\n" +
        "  Skills must be individual items, not categories (e.g. 'React' not 'Frontend Development').\n" +
        "- do not include soft skills",
      messages: [
        {
          role: "user",
          content: `Resume content:\n\n${resumeText.slice(0, 8000)}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Unexpected AI response format");

    const parsed = JSON.parse(jsonMatch[0]) as { titles?: unknown; skills?: unknown };

    const titles = Array.isArray(parsed.titles)
      ? (parsed.titles as unknown[]).filter((t): t is string => typeof t === "string")
      : [];
    const skills = Array.isArray(parsed.skills)
      ? (parsed.skills as unknown[]).filter((s): s is string => typeof s === "string")
      : [];

    return NextResponse.json({ titles, skills } satisfies ParseResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/profile/parse] Failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
