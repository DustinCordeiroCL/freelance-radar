import Parser from "rss-parser";
import type { RawProject } from "./types";

const RSS_URLS = [
  "https://www.workana.com/jobs/rss?lang=pt",
  "https://www.workana.com/jobs/rss?lang=es",
];

const parser = new Parser();

function extractIdFromUrl(url: string): string {
  const match = url.match(/\/job\/([^/?#]+)/);
  return match ? match[1] : url;
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  for (const rssUrl of RSS_URLS) {
    try {
      const feed = await parser.parseURL(rssUrl);

      for (const item of feed.items) {
        const url = item.link ?? "";
        const externalId = extractIdFromUrl(url);

        if (!externalId || seenIds.has(externalId)) continue;
        seenIds.add(externalId);

        results.push({
          externalId,
          title: item.title ?? "Untitled",
          description: item.contentSnippet ?? item.content ?? "",
          url,
          postedAt: item.pubDate ? new Date(item.pubDate) : undefined,
        });
      }
    } catch (err) {
      console.error(`[workana] Failed to fetch ${rssUrl}:`, err);
    }
  }

  return results;
}
