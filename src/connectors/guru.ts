import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

// Guru.com programming jobs RSS feed
const RSS_URL = "https://www.guru.com/d/jobs/c/programming/?format=rss";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.guru.com/",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractIdFromUrl(url: string): string | undefined {
  // Guru URL pattern: https://www.guru.com/d/jobs/id/123456/ or similar
  const match = url.match(/\/jobs\/id\/(\d+)/i) ?? url.match(/\/d\/jobs\/[^/]+\/([^/]+)\/?$/);
  return match?.[1];
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];

  try {
    const response = await axios.get<string>(RSS_URL, {
      headers: HEADERS,
      timeout: 15000,
    });

    // Detect bot-block pages (Incapsula, Cloudflare, etc.) that return HTML instead of RSS
    const contentType = (response.headers["content-type"] as string | undefined) ?? "";
    const isHtml =
      contentType.includes("text/html") ||
      (typeof response.data === "string" && response.data.trimStart().startsWith("<html"));

    if (isHtml) {
      console.warn("[guru] Bot protection detected — skipping (HTML returned instead of RSS)");
      return results;
    }

    const $ = cheerio.load(response.data, { xmlMode: true });

    $("item").each((_, el) => {
      const element = $(el);

      const title = element.find("title").text().trim();
      const link = element.find("link").text().trim() || element.find("guid").text().trim();
      const pubDate = element.find("pubDate").text().trim();
      const descriptionRaw = element.find("description").text().trim();

      if (!title || !link) return;

      const externalId = extractIdFromUrl(link) ?? link.split("/").filter(Boolean).pop();
      if (!externalId) return;

      const description = stripHtml(descriptionRaw) || title;
      const postedAt = pubDate ? new Date(pubDate) : undefined;

      results.push({
        externalId,
        title,
        description,
        url: link,
        country: "Remote",
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : undefined,
      });
    });

    console.log(`[guru] Found ${results.length} projects`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[guru] Blocked (${status}) — skipping`);
        return [];
      }
    }
    console.error("[guru] Fetch failed:", err);
  }

  return results;
}
