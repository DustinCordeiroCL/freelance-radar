import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

const URLS = [
  "https://www.workana.com/jobs?language=pt",
  "https://www.workana.com/jobs?language=es",
];

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

interface WorkanaResult {
  slug: string;
  title: string;
  description: string;
  authorName?: string;
  budget?: string;
  subcategory?: string;
  tags?: string[];
}

interface WorkanaInitials {
  results: WorkanaResult[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTitle(titleHtml: string): string {
  // Workana truncates the visible text — the full title is in the span's title attribute
  const match = titleHtml.match(/title="([^"]+)"/);
  if (match?.[1]) return match[1].trim();
  return stripHtml(titleHtml);
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenSlugs = new Set<string>();

  for (const url of URLS) {
    try {
      const response = await axios.get<string>(url, {
        headers: HEADERS,
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // Workana embeds job data as JSON in the :results-initials attribute
      const rawAttr = $("[\\:results-initials]").attr(":results-initials");

      if (!rawAttr) {
        console.warn(`[workana] Could not find :results-initials in ${url}`);
        continue;
      }

      const decoded = rawAttr
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'");

      const data = JSON.parse(decoded) as WorkanaInitials;

      for (const item of data.results ?? []) {
        if (!item.slug || seenSlugs.has(item.slug)) continue;
        seenSlugs.add(item.slug);

        results.push({
          externalId: item.slug,
          title: extractTitle(item.title),
          description: stripHtml(item.description),
          url: `https://www.workana.com/job/${item.slug}`,
          budget: item.budget ?? undefined,
          category: item.subcategory ?? undefined,
          tags: item.tags ?? [],
        });
      }

      console.log(`[workana] ${url}: found ${data.results?.length ?? 0} projects`);
    } catch (err) {
      console.error(`[workana] Failed to fetch ${url}:`, err);
    }
  }

  return results;
}
