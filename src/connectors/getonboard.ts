import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

// Domain changed from getonboard.com → getonbrd.com
const BASE_URL = "https://www.getonbrd.com";
const JOBS_URL = `${BASE_URL}/jobs/programming`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml",
};

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  console.log(`[getonboard] Fetching: ${JOBS_URL}`);

  try {
    const response = await axios.get<string>(JOBS_URL, {
      headers: HEADERS,
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);

    // Job cards: <a class="...gb-results-list__item..." href="https://www.getonbrd.com/jobs/programming/slug">
    $("a[class*='gb-results-list__item']").each((_, el) => {
      const card = $(el);
      const href = card.attr("href") ?? "";

      if (!href.includes("/jobs/")) return;

      // slug is the last path segment: /jobs/programming/job-title-company-location
      const slug = href.split("/").filter(Boolean).pop() ?? "";
      if (!slug || seenIds.has(slug)) return;
      seenIds.add(slug);

      // Title is inside h3 or h4 > strong
      const titleEl = card.find(".gb-results-list__title strong").first();
      const title = titleEl.text().trim() || card.find("h3, h4").first().text().trim();
      if (!title || title.length < 3) return;

      const company = card.find(".gb-results-list__info .size0 strong").first().text().trim();
      const description = company ? `${company} — ${title}` : title;

      // Summary from title attribute on the card
      const summary = card.attr("title") ?? "";

      results.push({
        externalId: slug,
        title,
        description: summary || description,
        url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
        tags: [],
        country: "CL",
        preFiltered: false,
      });
    });

    console.log(`[getonboard] Found ${results.length} jobs`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.warn(`[getonboard] Failed (${err.response?.status ?? err.code}) — skipping`);
    } else {
      console.error("[getonboard] Failed:", err);
    }
  }

  return results;
}
