import * as cheerio from "cheerio";
import { getBrowser } from "@/lib/browser";
import type { RawProject } from "./types";

const BASE_URL = "https://www.soyfreelancer.com";

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  // Prefer Spanish/Portuguese job titles for better results on this Spanish-language platform.
  // Keywords array is [...skills, ...titles]; titles tend to appear at the end and contain role names.
  const spanishTitle = keywords.find((kw) =>
    /desarrollador|programador|ingeniero|analista|fullstack|frontend|backend/i.test(kw)
  );
  const searchQuery = spanishTitle ?? keywords[0] ?? "desarrollador freelance";

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

    // Job URLs follow pattern: /trabajos-freelance/job/<alphanumericId>
    // Each job appears twice: once in h2.jobSubTitle>a (title link) and once as "Ver detalle" link.
    // We process only the title links (skip "Ver detalle") and climb to .jobRepeater for full card data.
    $("a[href*='/trabajos-freelance/job/']").each((_, el) => {
      const element = $(el);
      const linkText = element.text().trim();

      // Skip "Ver detalle" and other navigation links — we only want the title links
      if (!linkText || linkText.length < 5 || /ver detalle|ver más|apply|ver oferta/i.test(linkText)) return;

      const href = element.attr("href") ?? "";
      const idFromHref = href.match(/\/trabajos-freelance\/job\/([a-zA-Z0-9]+)/)?.[1];

      if (!idFromHref || seenIds.has(idFromHref)) return;
      seenIds.add(idFromHref);

      const title = linkText;

      // Climb to the .jobRepeater wrapper which holds the full card (description, budget, etc.)
      const card = element.closest(".jobRepeater, [class*='Repeater']");
      const description = card.find("p, [class*='desc'], [class*='excerpt'], [class*='body']").first().text().trim();
      const budget = card.find("[class*='budget'], [class*='price'], [class*='valor'], [class*='precio']").first().text().trim() || undefined;

      results.push({
        externalId: idFromHref,
        title,
        description: description || title,
        url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
        budget: budget || undefined,
        // This connector already searches by keyword — skip the isRelevant post-filter
        preFiltered: true,
      });
    });

    console.log(`[soyfreelancer] Found ${results.length} projects for query: "${searchQuery}"`);
  } catch (err) {
    console.error("[soyfreelancer] Failed:", err);
  }

  return results;
}
