import * as cheerio from "cheerio";
import { getBrowser } from "@/lib/browser";
import type { RawProject } from "./types";

const BASE_URL = "https://www.soyfreelancer.com";

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  const searchQuery = keywords.slice(0, 3).join(" ") || "desarrollo web";

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({ "Accept-Language": "es-CL,es;q=0.9" });

    // Load the jobs page
    const url = `${BASE_URL}/trabajos-freelance?q=${encodeURIComponent(searchQuery)}`;
    console.log(`[soyfreelancer] Fetching: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    // Dismiss cookie consent if present
    try {
      const acceptBtn = page.locator("button#rcc-confirm-button, button.cc-btn, .cc-allow, [aria-label*='cept'], button:has-text('Aceptar'), button:has-text('Accept')").first();
      if (await acceptBtn.isVisible({ timeout: 3000 })) {
        await acceptBtn.click();
        await page.waitForTimeout(500);
      }
    } catch {
      // No cookie banner or already dismissed
    }

    // Wait for job listings to render
    await page.waitForTimeout(3000);

    const html = await page.content();
    await page.close();

    const $ = cheerio.load(html);

    // Collect all job links — try multiple URL patterns
    $("a[href*='/trabajos/'], a[href*='/trabajo/'], a[href*='trabajos-freelance/']").each((_, el) => {
      const element = $(el);
      const href = element.attr("href") ?? "";
      const idFromHref = href.match(/\/(?:trabajos|trabajo|trabajos-freelance)\/(\d+)/)?.[1];

      if (!idFromHref || seenIds.has(idFromHref)) return;

      const container = element.closest("article, li, .card, [class*='job'], [class*='project'], [class*='listing']");
      const title = element.text().trim() || container.find("h2, h3, [class*='title']").first().text().trim();

      if (!title || title.length < 5) return;

      seenIds.add(idFromHref);

      const description = container.find("p, [class*='desc'], [class*='excerpt']").first().text().trim();
      const budget = container.find("[class*='budget'], [class*='price'], [class*='valor'], [class*='precio']").first().text().trim() || undefined;

      results.push({
        externalId: idFromHref,
        title,
        description: description || title,
        url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
        budget: budget || undefined,
      });
    });

    console.log(`[soyfreelancer] Found ${results.length} projects for query: "${searchQuery}"`);
  } catch (err) {
    console.error("[soyfreelancer] Failed:", err);
  }

  return results;
}
