import { anthropic } from "./anthropic";
import { CURRICULUM } from "@/data/curriculum";
import { prisma } from "./db";

interface ScoreResult {
  score: number;
  reason: string;
}

interface ProjectData {
  id: string;
  title: string;
  description: string;
  tags: string | null;
  budget: string | null;
}

async function callScoreApi(project: ProjectData): Promise<ScoreResult> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    system:
      "You are a compatibility evaluator between a developer and a freelance project.\n" +
      "Return ONLY a valid JSON object with no extra text: { \"score\": number from 0 to 100, \"reason\": \"one sentence explanation\" }",
    messages: [
      {
        role: "user",
        content:
          `Developer profile:\n${CURRICULUM}\n\n` +
          `Project:\n` +
          `Title: ${project.title}\n` +
          `Description: ${project.description}\n` +
          `Tags: ${project.tags ?? "none"}\n` +
          `Budget: ${project.budget ?? "not specified"}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Unexpected API response: ${text}`);

  const parsed = JSON.parse(jsonMatch[0]) as { score?: unknown; reason?: unknown };

  const score = typeof parsed.score === "number" ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 0;
  const reason = typeof parsed.reason === "string" ? parsed.reason : "";

  return { score, reason };
}

export async function scoreProject(projectId: string): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) return;

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || project.matchScore !== null) return;

  try {
    const { score, reason } = await callScoreApi(project);

    await prisma.project.update({
      where: { id: projectId },
      data: { matchScore: score, scoreReason: reason },
    });

    console.log(`[scorer] ${project.platform}/${project.externalId}: score=${score}`);
  } catch (err) {
    console.error(`[scorer] Failed to score project ${projectId}:`, err);
  }
}
