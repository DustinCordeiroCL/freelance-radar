import { getAnthropicClient, NoApiKeyError } from "./anthropic";
import { resolveAnthropicKey } from "./keys";
import { getProfileContext } from "./profile";
import { sendNotification } from "./notifier";
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
  const client = await getAnthropicClient();
  const profileContext = await getProfileContext();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system:
      "You are a compatibility evaluator between a developer and a freelance project.\n" +
      "Return ONLY a valid JSON object with no extra text: { \"score\": number from 0 to 100, \"reason\": \"one sentence explanation\" }",
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

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Unexpected API response: ${text}`);

  const parsed = JSON.parse(jsonMatch[0]) as { score?: unknown; reason?: unknown };

  const score = typeof parsed.score === "number" ? Math.min(100, Math.max(0, Math.round(parsed.score))) : 0;
  const reason = typeof parsed.reason === "string" ? parsed.reason : "";

  return { score, reason };
}

export async function scoreProject(projectId: string): Promise<void> {
  const apiKey = await resolveAnthropicKey();
  if (!apiKey?.trim()) return; // sem chave — silencioso

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project || project.matchScore !== null) return;

  try {
    const { score, reason } = await callScoreApi(project);

    await prisma.project.update({
      where: { id: projectId },
      data: { matchScore: score, scoreReason: reason },
    });

    console.log(`[scorer] ${project.platform}/${project.externalId}: score=${score}`);

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings && score >= settings.scoreAlertThreshold) {
      sendNotification(
        `FreelanceRadar — High match (${score})`,
        project.title
      );
    }
  } catch (err) {
    if (err instanceof NoApiKeyError) return; // chave ausente — já verificado acima, mas por segurança

    // Chave inválida/revogada (401) — logar brevemente sem sobrescrever o score
    const isAuthError =
      err instanceof Error &&
      (err.message.includes("401") || err.message.includes("authentication_error"));

    if (isAuthError) {
      console.warn("[scorer] Chave de API inválida — scoring desativado até configurar uma chave válida");
      return;
    }

    // Outro erro (rede, parse, etc.) — marcar como falhou para não ficar re-enfileirando
    console.error(`[scorer] Erro ao pontuar ${projectId}: ${err instanceof Error ? err.message : String(err)}`);
    await prisma.project.update({
      where: { id: projectId },
      data: { matchScore: 0, scoreReason: "Error de puntuación — reintenta más tarde" },
    }).catch(() => { /* ignore */ });
  }
}
