import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

// Indeed Chile RSS feed — more reliable than HTML scraping (bypasses most anti-bot)
const RSS_URL = "https://cl.indeed.com/rss";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-CL,es;q=0.9",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

const QUERIES = ["desarrollador web freelance", "programador freelance"];

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z#\d]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractJobId(link: string): string | null {
  const match = link.match(/jk=([a-f0-9]+)/i);
  return match ? match[1] : null;
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  for (const q of QUERIES) {
    try {
      const response = await axios.get<string>(RSS_URL, {
        params: { q, l: "Chile", sort: "date" },
        headers: HEADERS,
        timeout: 15000,
      });

      if (response.status !== 200) {
        console.warn(`[indeed] Unexpected status ${response.status} for query "${q}"`);
        continue;
      }

      const $ = cheerio.load(response.data, { xmlMode: true });
      let found = 0;

      $("item").each((_, el) => {
        const link = $(el).find("link").text().trim() || $(el).find("guid").text().trim();
        const title = $(el).find("title").text().trim();
        const descRaw = $(el).find("description").text().trim();
        const pubDate = $(el).find("pubDate").text().trim();

        if (!link || !title) return;

        const jobId = extractJobId(link);
        if (!jobId || seenIds.has(jobId)) return;
        seenIds.add(jobId);

        const description = stripHtml(descRaw);
        const postedAt = pubDate ? new Date(pubDate) : undefined;

        results.push({
          externalId: jobId,
          title,
          description: description || title,
          url: link,
          country: "CL",
          postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : undefined,
        });

        found++;
      });

      console.log(`[indeed] RSS query "${q}": found ${found} jobs`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403 || status === 429) {
          console.warn(`[indeed] Blocked (${status}) — skipping`);
          return results;
        }
      }
      console.error("[indeed] RSS fetch failed:", err);
    }
  }

  return results;
}
