import Anthropic from "@anthropic-ai/sdk";
import { resolveAnthropicKey } from "./keys";

export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await resolveAnthropicKey();
  if (!apiKey) {
    console.warn("[anthropic] No API key configured — AI features will be unavailable");
  }
  return new Anthropic({ apiKey });
}
