import * as cheerio from "cheerio";
import { fetchRenderedHtml } from "@/lib/browser";
import type { RawProject } from "./types";

const BASE_URL = "https://cl.indeed.com";
const QUERIES = ["desarrollador web freelance", "programador freelance"];

function extractJobId(href: string): string | null {
  const match = href.match(/jk=([a-f0-9]+)/i);
  return match ? match[1] : null;
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  for (const q of QUERIES) {
    const url = `${BASE_URL}/jobs?q=${encodeURIComponent(q)}&l=Chile&sort=date`;

    try {
      console.log(`[indeed] Fetching (Playwright): ${url}`);
      const html = await fetchRenderedHtml(url, 3000);
      const $ = cheerio.load(html);
      let found = 0;

      // Try multiple selector strategies — Indeed changes class names frequently
      $("a[href*='/rc/clk'], a[href*='viewjob'], a[id*='job_'], a[data-jk]").each((_, el) => {
        const href = $(el).attr("href") ?? "";
        const dataJk = $(el).attr("data-jk") ?? "";
        const jobId = dataJk || extractJobId(href);

        if (!jobId || seenIds.has(jobId)) return;
        seenIds.add(jobId);

        const container = $(el).closest("div[class*='job'], li[class*='job'], article, [data-testid*='job']");
        const title = $(el).text().trim() || container.find("h2, h3, [class*='title']").first().text().trim();
        if (!title || title.length < 5) return;

        const company = container.find("[data-testid='company-name'], [class*='company']").first().text().trim();
        const snippet = container.find("[class*='snippet'], [class*='summary'], p").first().text().trim();
        const description = [company, snippet].filter(Boolean).join(" — ") || title;

        const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;

        results.push({
          externalId: jobId,
          title,
          description,
          url: fullUrl,
          country: "CL",
        });

        found++;
      });

      console.log(`[indeed] Query "${q}": found ${found} jobs`);
    } catch (err) {
      console.error(`[indeed] Failed for query "${q}":`, err);
    }
  }

  return results;
}
