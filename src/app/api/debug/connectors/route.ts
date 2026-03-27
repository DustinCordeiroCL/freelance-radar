import { NextResponse } from "next/server";
import { fetchRenderedHtml } from "@/lib/browser";
import * as cheerio from "cheerio";

const TARGETS = [
  {
    name: "soyfreelancer",
    url: "https://www.soyfreelancer.com/trabajos?q=desarrollo+web",
    selector: "a[href*='/trabajos/']",
  },
  {
    name: "indeed",
    url: "https://cl.indeed.com/jobs?q=desarrollador+web&l=Chile&sort=date",
    selector: "a[href*='viewjob'], a[data-jk], a[href*='/rc/clk']",
  },
];

export async function GET(): Promise<NextResponse> {
  const results: Record<string, {
    matchingElements: number;
    htmlSnippet: string;
    allLinks: string[];
    error?: string;
  }> = {};

  for (const { name, url, selector } of TARGETS) {
    try {
      const html = await fetchRenderedHtml(url, 3000);
      const $ = cheerio.load(html);

      const matchingElements = $(selector).length;
      // Return first 3000 chars of body text to inspect structure
      const htmlSnippet = $("body").html()?.slice(0, 3000) ?? "";
      // Collect all unique href patterns to understand the link structure
      const allLinks: string[] = [];
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") ?? "";
        if (href.length > 3 && !allLinks.includes(href)) allLinks.push(href);
      });

      results[name] = {
        matchingElements,
        htmlSnippet,
        allLinks: allLinks.slice(0, 30),
      };
    } catch (err) {
      results[name] = {
        matchingElements: 0,
        htmlSnippet: "",
        allLinks: [],
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  return NextResponse.json(results);
}
