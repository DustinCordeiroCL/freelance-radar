import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

const SEARCH_URL = "https://cl.indeed.com/jobs";
const SEARCH_QUERY = "desarrollador freelance";

// Realistic browser headers to reduce bot detection risk
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

function extractJobId(href: string): string | null {
  const match = href.match(/jk=([a-f0-9]+)/i);
  return match ? match[1] : null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collect(): Promise<RawProject[]> {
  try {
    await delay(2000 + Math.random() * 3000);

    const response = await axios.get(SEARCH_URL, {
      params: { q: SEARCH_QUERY, l: "Chile" },
      headers: HEADERS,
      timeout: 15000,
    });

    if (response.status !== 200) {
      console.warn(`[indeed] Unexpected status ${response.status} — skipping`);
      return [];
    }

    const $ = cheerio.load(response.data as string);
    const results: RawProject[] = [];

    $("div.job_seen_beacon, li.css-5lfssm").each((_, el) => {
      const titleEl = $(el).find("h2.jobTitle a, a.jcs-JobTitle");
      const href = titleEl.attr("href") ?? "";
      const jobId = extractJobId(href);

      if (!jobId) return;

      const title = titleEl.text().trim();
      const company = $(el).find("[data-testid='company-name'], .companyName").text().trim();
      const location = $(el).find("[data-testid='text-location'], .companyLocation").text().trim();
      const snippet = $(el).find(".job-snippet, div[class*='snippet']").text().trim();

      const description = [company, location, snippet].filter(Boolean).join(" — ");
      const url = href.startsWith("http")
        ? href
        : `https://cl.indeed.com${href}`;

      results.push({
        externalId: jobId,
        title: title || "Untitled",
        description: description || snippet,
        url,
        country: "CL",
      });
    });

    if (results.length === 0) {
      console.warn("[indeed] No jobs found — page structure may have changed or bot was detected");
    }

    return results;
  } catch (err) {
    if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 429)) {
      console.error("[indeed] Blocked by anti-bot protection — disabling connector until manually re-enabled");
    } else {
      console.error("[indeed] Scraping failed:", err);
    }
    return [];
  }
}
