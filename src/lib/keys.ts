/**
 * Resolve the Anthropic API key for a given server-side request.
 * Priority: x-anthropic-key header → ANTHROPIC_API_KEY env var.
 * The key is NEVER stored in the database — it lives in the visitor's localStorage
 * and is sent per-request via the x-anthropic-key header.
 */
export function resolveAnthropicKey(headerKey?: string | null): string {
  return headerKey?.trim() || process.env.ANTHROPIC_API_KEY?.trim() || "";
}

export async function resolveFreelancerToken(): Promise<string | null> {
  const { prisma } = await import("@/lib/db");
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 1 },
      select: { freelancerToken: true },
    });
    if (settings?.freelancerToken) return settings.freelancerToken;
  } catch { /* ignore */ }
  return process.env.FREELANCER_API_TOKEN ?? null;
}
