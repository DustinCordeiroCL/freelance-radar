import * as cheerio from "cheerio";
import { getBrowser } from "@/lib/browser";
import type { RawProject } from "./types";

const BASE_URL = "https://programathor.com.br";

// Programathor uses slug-based URLs like /jobs-react or /jobs-backend
// Only single lowercase words without spaces work as slugs
function pickSlug(keywords: string[]): string | null {
  const singleWord = keywords.find((kw) => /^\w+$/.test(kw));
  return singleWord ? singleWord.toLowerCase() : null;
}

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  const slug = pickSlug(keywords);
  const url = slug ? `${BASE_URL}/jobs-${slug}` : `${BASE_URL}/jobs`;

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9" });

    console.log(`[programathor] Fetching: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);

    // Dismiss cookie consent if present
    try {
      const acceptBtn = page
        .locator("button:has-text('Aceitar'), button:has-text('Accept'), .cc-btn, #accept-cookies")
        .first();
      if (await acceptBtn.isVisible({ timeout: 2000 })) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // No cookie banner
    }

    const html = await page.content();
    await page.close();

    const $ = cheerio.load(html);

    // Job cards are typically in <div class="cell-list"> or similar containers
    $("a[href*='/jobs/']").each((_, el) => {
      const element = $(el);
      const href = element.attr("href") ?? "";

      const idMatch = href.match(/\/jobs\/(\d+)/);
      const externalId = idMatch?.[1] ?? "";
      if (!externalId || seenIds.has(externalId)) return;
      seenIds.add(externalId);

      const title =
        element.find("h2, h3, [class*='title'], [class*='job-title']").first().text().trim() ||
        element.attr("title") ||
        element.text().trim();

      if (!title || title.length < 4) return;

      const card = element.closest("[class*='cell'], [class*='card'], [class*='job'], li");
      const description = card
        .find("p, [class*='desc'], [class*='summary']")
        .first()
        .text()
        .trim();
      const tags = card
        .find("[class*='tag'], [class*='tech'], [class*='skill'], span")
        .map((__, t) => $(t).text().trim())
        .get()
        .filter((t) => t.length > 1 && t.length < 30);

      results.push({
        externalId,
        title,
        description: description || title,
        url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
        tags: tags.slice(0, 8),
        country: "BR",
        preFiltered: keywords.length > 0,
      });
    });

    console.log(`[programathor] Found ${results.length} jobs (slug: ${slug ?? "none"})`);
  } catch (err) {
    console.error("[programathor] Failed:", err);
  }

  return results;
}
