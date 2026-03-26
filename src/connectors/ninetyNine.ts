import Parser from "rss-parser";
import type { RawProject } from "./types";

const RSS_URL = "https://www.99freelas.com.br/projects/rss";

const parser = new Parser();

function extractIdFromUrl(url: string): string {
  const match = url.match(/\/project\/(\d+)/);
  return match ? match[1] : url;
}

export async function collect(): Promise<RawProject[]> {
  try {
    const feed = await parser.parseURL(RSS_URL);
    const results: RawProject[] = [];

    for (const item of feed.items) {
      const url = item.link ?? "";
      const externalId = extractIdFromUrl(url);

      if (!externalId) continue;

      results.push({
        externalId,
        title: item.title ?? "Untitled",
        description: item.contentSnippet ?? item.content ?? "",
        url,
        postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
      });
    }

    return results;
  } catch (err) {
    console.error("[99freelas] Failed to fetch RSS:", err);
    return [];
  }
}
