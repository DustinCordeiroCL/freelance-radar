import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

const RSS_BASE = "https://www.upwork.com/ab/feed/jobs/rss";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

function buildSearchQuery(keywords: string[]): string {
  if (keywords.length === 0) return "react typescript nodejs";
  // Use top 6 skills to keep query focused
  return keywords.slice(0, 6).join(" ");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractBudget(text: string): string | undefined {
  const match = text.match(/\$[\d,]+ ?[-–] ?\$[\d,]+|\$[\d,]+\/hr|\$[\d,]+/);
  return match ? match[0] : undefined;
}

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const query = buildSearchQuery(keywords);

  const url = `${RSS_BASE}?q=${encodeURIComponent(query)}&sort=recency&paging=0%3B50`;

  try {
    const response = await axios.get<string>(url, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    $("item").each((_, el) => {
      const element = $(el);

      const link = element.find("link").text().trim() || element.find("guid").text().trim();
      const title = element.find("title").text().trim();
      const descriptionRaw = element.find("description").text().trim();
      const pubDate = element.find("pubDate").text().trim();

      if (!link || !title) return;

      const idMatch = link.match(/~([a-zA-Z0-9]+)/);
      if (!idMatch) return;
      const externalId = idMatch[1];

      const description = stripHtml(descriptionRaw);
      const budget = extractBudget(description);

      const postedAt = pubDate ? new Date(pubDate) : undefined;

      results.push({
        externalId,
        title,
        description,
        url: link,
        budget,
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : undefined,
      });
    });

    console.log(`[upwork] Found ${results.length} projects for query: "${query}"`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[upwork] Blocked (${status ?? "unknown"}) — skipping`);
        return [];
      }
    }
    console.error("[upwork] Fetch failed:", err);
  }

  return results;
}
