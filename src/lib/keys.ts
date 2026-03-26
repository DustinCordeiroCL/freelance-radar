import { prisma } from "@/lib/db";

async function getStoredSettings(): Promise<{ anthropicKey: string | null; freelancerToken: string | null } | null> {
  try {
    return await prisma.settings.findUnique({
      where: { id: 1 },
      select: { anthropicKey: true, freelancerToken: true },
    });
  } catch {
    return null;
  }
}

export async function resolveAnthropicKey(): Promise<string> {
  const settings = await getStoredSettings();
  if (settings?.anthropicKey) return settings.anthropicKey;
  return process.env.ANTHROPIC_API_KEY ?? "";
}

export async function resolveFreelancerToken(): Promise<string | null> {
  const settings = await getStoredSettings();
  if (settings?.freelancerToken) return settings.freelancerToken;
  const envToken = process.env.FREELANCER_API_TOKEN;
  return envToken ?? null;
}
