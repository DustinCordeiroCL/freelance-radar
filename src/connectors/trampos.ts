import axios from "axios";
import type { RawProject } from "./types";

const BASE_URL = "https://trampos.co";
const API_URL = `${BASE_URL}/api/v2/opportunities`;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "pt-BR,pt;q=0.9",
};

interface TramposCompany {
  name: string;
}

interface TramposOpportunity {
  id: number;
  name: string;
  type_name?: string;
  category_slug?: string;
  salary?: string;
  published_at?: string;
  home_office?: boolean;
  state?: string;
  city?: string;
  company?: TramposCompany;
  twitter_share_url?: string;
}

interface TramposResponse {
  opportunities: TramposOpportunity[];
  pagination: {
    total: number;
    total_pages: number;
    per_page: number;
  };
}

function buildUrl(opp: TramposOpportunity): string {
  // Try to extract slug from twitter_share_url which has the full slug
  if (opp.twitter_share_url) {
    const match = opp.twitter_share_url.match(/trampos\.co\/oportunidades\/([^\s?&"']+)/);
    if (match?.[1]) return `${BASE_URL}/oportunidades/${match[1]}`;
  }
  return `${BASE_URL}/oportunidades/${opp.id}`;
}

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];
  const seenIds = new Set<string>();

  try {
    // Fetch up to 2 pages of tech jobs (category=ti)
    for (let page = 1; page <= 2; page++) {
      const response = await axios.get<TramposResponse>(API_URL, {
        params: { category: "ti", page },
        headers: HEADERS,
        timeout: 15000,
      });

      const { opportunities, pagination } = response.data;

      for (const opp of opportunities) {
        const externalId = String(opp.id);
        if (seenIds.has(externalId)) continue;
        seenIds.add(externalId);

        const title = opp.name?.trim();
        if (!title) continue;

        const parts: string[] = [];
        if (opp.company?.name) parts.push(opp.company.name);
        if (opp.type_name) parts.push(opp.type_name);
        if (opp.home_office) parts.push("Remoto");
        else if (opp.city && opp.state) parts.push(`${opp.city}/${opp.state}`);
        else if (opp.state) parts.push(opp.state);

        const description = parts.join(" — ") || title;

        results.push({
          externalId,
          title,
          description,
          url: buildUrl(opp),
          budget: opp.salary || undefined,
          country: "BR",
          postedAt: opp.published_at ? new Date(opp.published_at) : undefined,
          preFiltered: true,
        });
      }

      if (page >= pagination.total_pages) break;
    }

    console.log(`[trampos] Found ${results.length} projects`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[trampos] Blocked (${status}) — skipping`);
        return [];
      }
    }
    console.error("[trampos] Fetch failed:", err);
  }

  return results;
}
