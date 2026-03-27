import axios from "axios";
import type { RawProject } from "./types";

const SEARCH_URL = "https://search.torre.co/opportunities/_search";

const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

interface TorreSkill {
  name: string;
}

interface TorreCompensation {
  data?: {
    minAmount?: number;
    maxAmount?: number;
    currency?: string;
    periodicity?: string;
  };
}

interface TorreOrganization {
  name?: string;
}

interface TorreOpportunity {
  id?: string;
  objective?: string;
  organizations?: TorreOrganization[];
  compensation?: TorreCompensation;
  skills?: TorreSkill[];
  remote?: boolean;
  timezones?: string[];
}

interface TorreSearchResponse {
  results?: TorreOpportunity[];
}

function formatBudget(comp?: TorreCompensation): string | undefined {
  const d = comp?.data;
  if (!d?.minAmount && !d?.maxAmount) return undefined;
  const currency = d.currency ?? "USD";
  const period = d.periodicity === "monthly" ? "/mo" : d.periodicity === "hourly" ? "/hr" : "";
  if (d.minAmount && d.maxAmount) {
    return `${currency} ${d.minAmount.toLocaleString()}–${d.maxAmount.toLocaleString()}${period}`;
  }
  return `${currency} ${(d.minAmount ?? d.maxAmount)!.toLocaleString()}${period}`;
}

export async function collect(keywords: string[] = []): Promise<RawProject[]> {
  const results: RawProject[] = [];

  const body: Record<string, unknown> = {
    aggregate: false,
    size: 20,
  };

  if (keywords.length > 0) {
    body.q = keywords.slice(0, 3).join(" OR ");
  }

  try {
    const response = await axios.post<TorreSearchResponse>(SEARCH_URL, body, {
      headers: HEADERS,
      timeout: 15000,
    });

    const opportunities = response.data?.results ?? [];

    for (const opp of opportunities) {
      const id = opp.id ?? "";
      const title = opp.objective ?? "";
      if (!id || !title) continue;

      results.push({
        externalId: id,
        title,
        description: [
          opp.organizations?.[0]?.name,
          opp.skills?.map((s) => s.name).join(", "),
        ]
          .filter(Boolean)
          .join(" — ") || title,
        url: `https://torre.co/opportunities/${id}`,
        budget: formatBudget(opp.compensation),
        tags: opp.skills?.map((s) => s.name) ?? [],
        country: opp.timezones?.[0] ?? (opp.remote ? "Remote" : undefined),
        preFiltered: keywords.length > 0,
      });
    }

    console.log(`[torre] Found ${results.length} opportunities`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[torre] Blocked (${status}) — skipping`);
        return [];
      }
    }
    console.error("[torre] Fetch failed:", err);
  }

  return results;
}
