import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

const BASE_URL = "https://www.soyfreelancer.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  // Use top 3 keywords to keep query focused; default to web development if no profile
  const searchQuery = keywords.slice(0, 3).join(" ") || "desarrollo web";
  const url = `${BASE_URL}/trabajos?q=${encodeURIComponent(searchQuery)}`;

  try {
    await randomDelay(1000, 2500);

    const response = await axios.get<string>(url, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Try multiple selector strategies in order of specificity
    let found = false;

    // Strategy 1: links directly to /trabajos/:id (most reliable)
    $("a[href*='/trabajos/']").each((_, el) => {
      const element = $(el);
      const href = element.attr("href") ?? "";
      const idFromHref = href.match(/\/trabajos\/(\d+)/)?.[1];

      if (!idFromHref || seenIds.has(idFromHref)) return;

      // Try to get the parent container for more context
      const container = element.closest("article, li, div.job, div.project, .card, [class*='job'], [class*='project']");
      const title = element.text().trim() || container.find("h2, h3, .title, [class*='title']").first().text().trim();

      if (!title || title.length < 5) return;

      seenIds.add(idFromHref);
      found = true;

      const description = container.find("p, .description, .excerpt, [class*='desc']").first().text().trim();
      const budget = container.find("[class*='budget'], [class*='price'], [class*='valor']").first().text().trim() || undefined;
      const tagsRaw: string[] = [];
      container.find(".tag, .skill, .category, [class*='tag'], [class*='skill'], [class*='category']").each((_, t) => {
        const tag = $(t).text().trim();
        if (tag && tag.length < 50) tagsRaw.push(tag);
      });

      const jobUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      results.push({
        externalId: idFromHref,
        title,
        description: description || title,
        url: jobUrl,
        budget: budget || undefined,
        tags: tagsRaw,
      });
    });

    if (!found) {
      console.warn("[soyfreelancer] No jobs found — page structure may have changed or scraping was blocked");
    } else {
      console.log(`[soyfreelancer] Found ${results.length} projects for query: "${searchQuery}"`);
    }
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 429)) {
      console.warn("[soyfreelancer] Rate limited or blocked — skipping");
    } else {
      console.error("[soyfreelancer] Fetch failed:", err);
    }
  }

  return results;
}
