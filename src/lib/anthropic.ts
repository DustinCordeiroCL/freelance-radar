import Anthropic from "@anthropic-ai/sdk";

export class NoApiKeyError extends Error {
  constructor() {
    super("NO_API_KEY");
    this.name = "NoApiKeyError";
  }
}

export function getAnthropicClient(apiKey: string): Anthropic {
  if (!apiKey.trim()) throw new NoApiKeyError();
  return new Anthropic({ apiKey });
}
