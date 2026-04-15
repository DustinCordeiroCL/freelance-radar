import Anthropic from "@anthropic-ai/sdk";
import { resolveAnthropicKey } from "./keys";

export class NoApiKeyError extends Error {
  constructor() {
    super("NO_API_KEY");
    this.name = "NoApiKeyError";
  }
}

export async function getAnthropicClient(): Promise<Anthropic> {
  const apiKey = await resolveAnthropicKey();
  if (!apiKey?.trim()) throw new NoApiKeyError();
  return new Anthropic({ apiKey });
}
