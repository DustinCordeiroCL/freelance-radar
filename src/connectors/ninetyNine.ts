import axios from "axios";
import * as cheerio from "cheerio";
import type { RawProject } from "./types";

const BASE_URL = "https://www.99freelas.com.br";
const PROJECTS_URL = `${BASE_URL}/projects?categoria=2`; // categoria=2 = Web, Mobile & Software

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "pt-BR,pt;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export async function collect(): Promise<RawProject[]> {
  try {
    const response = await axios.get<string>(PROJECTS_URL, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const results: RawProject[] = [];

    $("ul.result-list li.result-item").each((_, el) => {
      const id = $(el).attr("data-id");
      if (!id) return;

      const titleEl = $(el).find("h1.title a");
      const title = titleEl.text().trim();
      const href = titleEl.attr("href") ?? "";
      const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

      const description = $(el).find(".description").attr("data-content") ?? "";
      const cleanDescription = description
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .trim();

      const infoText = $(el).find("p.item-text.information").text();
      const categoryMatch = infoText.match(/^([^|]+)/);
      const category = categoryMatch ? categoryMatch[1]!.trim() : undefined;

      const postedTimestamp = $(el).find("b.datetime").attr("cp-datetime");
      const postedAt = postedTimestamp ? new Date(parseInt(postedTimestamp, 10)) : undefined;

      results.push({
        externalId: id,
        title: title || "Untitled",
        description: cleanDescription,
        url,
        category,
        country: "BR",
        postedAt,
      });
    });

    console.log(`[99freelas] Found ${results.length} projects`);
    return results;
  } catch (err) {
    console.error("[99freelas] Scraping failed:", err);
    return [];
  }
}
