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

  const searchQuery = keywords.slice(0, 5).join(" ") || "desarrollo web";
  const url = `${BASE_URL}/trabajos?q=${encodeURIComponent(searchQuery)}`;

  try {
    await randomDelay(1000, 2500);

    const response = await axios.get<string>(url, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // SoyFreelancer lists jobs in article or li elements with job data
    $("article, .job-item, .project-item, li[data-id]").each((_, el) => {
      const element = $(el);

      const idAttr = element.attr("data-id") ?? element.attr("id") ?? "";
      const linkEl = element.find("a[href*='/trabajos/']").first();
      const href = linkEl.attr("href") ?? "";

      const idFromHref = href.match(/\/trabajos\/(\d+)/)?.[1];
      const externalId = idFromHref ?? idAttr;

      if (!externalId || seenIds.has(externalId)) return;
      seenIds.add(externalId);

      const title = linkEl.text().trim() || element.find("h2, h3, .title").first().text().trim();
      if (!title) return;

      const description = element.find("p, .description, .excerpt").first().text().trim();
      const budget = element.find(".budget, .price, [class*='budget'], [class*='price']").first().text().trim() || undefined;
      const tagsRaw: string[] = [];
      element.find(".tag, .skill, .category, [class*='tag'], [class*='skill']").each((_, t) => {
        const tag = $(t).text().trim();
        if (tag) tagsRaw.push(tag);
      });

      const jobUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      results.push({
        externalId,
        title,
        description: description || title,
        url: jobUrl,
        budget: budget || undefined,
        tags: tagsRaw,
      });
    });

    // Fallback: look for links to individual job pages if structured elements not found
    if (results.length === 0) {
      $("a[href*='/trabajos/']").each((_, el) => {
        const element = $(el);
        const href = element.attr("href") ?? "";
        const idFromHref = href.match(/\/trabajos\/(\d+)/)?.[1];

        if (!idFromHref || seenIds.has(idFromHref)) return;
        seenIds.add(idFromHref);

        const title = element.text().trim();
        if (!title || title.length < 5) return;

        const jobUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        results.push({
          externalId: idFromHref,
          title,
          description: title,
          url: jobUrl,
        });
      });
    }

    console.log(`[soyfreelancer] Found ${results.length} projects for query: "${searchQuery}"`);
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 429)) {
      console.warn("[soyfreelancer] Rate limited or blocked — skipping");
    } else {
      console.error("[soyfreelancer] Fetch failed:", err);
    }
  }

  return results;
}
