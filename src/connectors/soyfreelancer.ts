import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "@/lib/browser";
import type { RawProject } from "./types";

const BASE_URL = "https://www.soyfreelancer.com";

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  const searchQuery = keywords.slice(0, 3).join(" ") || "desarrollo web";
  const url = `${BASE_URL}/trabajos?q=${encodeURIComponent(searchQuery)}`;

  try {
    console.log(`[soyfreelancer] Fetching (Playwright): ${url}`);
    const html = await fetchRenderedHtml(url, 2500);
    const $ = cheerio.load(html);

    $("a[href*='/trabajos/']").each((_, el) => {
      const element = $(el);
      const href = element.attr("href") ?? "";
      const idFromHref = href.match(/\/trabajos\/(\d+)/)?.[1];

      if (!idFromHref || seenIds.has(idFromHref)) return;

      const container = element.closest("article, li, div, .card, [class*='job'], [class*='project']");
      const title = element.text().trim() || container.find("h2, h3, [class*='title']").first().text().trim();

      if (!title || title.length < 5) return;

      seenIds.add(idFromHref);

      const description = container.find("p, [class*='desc'], [class*='excerpt']").first().text().trim();
      const budget = container.find("[class*='budget'], [class*='price'], [class*='valor']").first().text().trim() || undefined;
      const tagsRaw: string[] = [];
      container.find("[class*='tag'], [class*='skill'], [class*='category']").each((_, t) => {
        const tag = $(t).text().trim();
        if (tag && tag.length < 50) tagsRaw.push(tag);
      });

      results.push({
        externalId: idFromHref,
        title,
        description: description || title,
        url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
        budget: budget || undefined,
        tags: tagsRaw,
      });
    });

    console.log(`[soyfreelancer] Found ${results.length} projects for query: "${searchQuery}"`);
  } catch (err) {
    console.error("[soyfreelancer] Playwright fetch failed:", err);
  }

  return results;
}
