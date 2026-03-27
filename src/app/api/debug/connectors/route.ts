import { NextResponse } from "next/server";
import { fetchRenderedHtml } from "@/lib/browser";
import * as cheerio from "cheerio";

const TARGETS = [
  {
    name: "soyfreelancer",
    url: "https://www.soyfreelancer.com/trabajos-freelance?q=desarrollo+web",
    jobSelector: "a[href*='/trabajos-freelance/job/']",
  },
];

export async function GET(): Promise<NextResponse> {
  const results: Record<string, unknown> = {};

  for (const { name, url, jobSelector } of TARGETS) {
    try {
      const html = await fetchRenderedHtml(url, 3000);
      const $ = cheerio.load(html);

      // Inspect matched job links
      const jobLinks: Array<{
        href: string;
        linkText: string;
        containerTag: string;
        containerClasses: string;
        containerHtml: string;
        h2: string;
        h3: string;
      }> = [];

      $(jobSelector).each((i, el) => {
        if (i >= 5) return; // Only first 5 for inspection
        const element = $(el);
        const href = element.attr("href") ?? "";
        const linkText = element.text().trim();
        const container = element.closest("article, li, .card, [class*='job'], [class*='project'], [class*='listing']");
        const parentEl = element.parent();

        jobLinks.push({
          href,
          linkText,
          containerTag: container.length ? ((container.get(0) as { tagName?: string } | undefined)?.tagName ?? "none") : "none",
          containerClasses: container.length ? (container.attr("class") ?? "") : "",
          containerHtml: container.length ? (container.html()?.slice(0, 500) ?? "") : parentEl.html()?.slice(0, 500) ?? "",
          h2: container.find("h2").first().text().trim(),
          h3: container.find("h3").first().text().trim(),
        });
      });

      results[name] = {
        totalJobLinks: $(jobSelector).length,
        jobLinks,
        bodyStart: $("body").html()?.slice(0, 2000) ?? "",
      };
    } catch (err) {
      results[name] = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(results);
}
