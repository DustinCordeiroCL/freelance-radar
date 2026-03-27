import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

const RSS_URL = "https://weworkremotely.com/categories/remote-programming-jobs.rss";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function extractIdFromGuid(guid: string): string | undefined {
  // guid format: https://weworkremotely.com/remote-jobs/12345-job-slug#job-12345
  const match = guid.match(/\/remote-jobs\/([^#\s]+)/);
  return match?.[1];
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];

  try {
    const response = await axios.get<string>(RSS_URL, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data, { xmlMode: true });

    $("item").each((_, el) => {
      const element = $(el);

      const title = element.find("title").text().trim();
      const guid = element.find("guid").text().trim();
      const pubDate = element.find("pubDate").text().trim();
      const descriptionRaw = element.find("description").text().trim();

      // In RSS with xmlMode, <link> is tricky — prefer guid for the URL
      // WWR guid IS the job URL
      const url = guid || element.find("link").text().trim();

      if (!title || !guid) return;

      const externalId = extractIdFromGuid(guid);
      if (!externalId) return;

      const description = stripHtml(descriptionRaw) || title;
      const postedAt = pubDate ? new Date(pubDate) : undefined;

      results.push({
        externalId,
        title,
        description,
        url,
        country: "Remote",
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : undefined,
      });
    });

    console.log(`[weworkremotely] Found ${results.length} projects`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[weworkremotely] Blocked (${status}) — skipping`);
        return [];
      }
    }
    console.error("[weworkremotely] Fetch failed:", err);
  }

  return results;
}
