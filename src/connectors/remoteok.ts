import axios from "axios";
import type { RawProject } from "./types";

const API_URL = "https://remoteok.com/api";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

interface RemoteOKJob {
  id?: string | number;
  slug?: string;
  position?: string;
  description?: string;
  tags?: string[];
  company?: string;
  url?: string;
  apply_url?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
  location?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function buildBudget(job: RemoteOKJob): string | undefined {
  if (job.salary_min && job.salary_max) {
    return `$${job.salary_min.toLocaleString()}–$${job.salary_max.toLocaleString()}/yr`;
  }
  if (job.salary_min) return `from $${job.salary_min.toLocaleString()}/yr`;
  return undefined;
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];

  try {
    const response = await axios.get<RemoteOKJob[]>(API_URL, {
      headers: HEADERS,
      timeout: 15000,
    });

    // First element is metadata object, skip it
    const jobs = response.data.slice(1);

    for (const job of jobs) {
      const externalId = job.slug ?? String(job.id ?? "");
      const title = job.position ?? "";
      if (!externalId || !title) continue;

      const url = job.url ?? `https://remoteok.com/remote-jobs/${externalId}`;
      const description = job.description ? stripHtml(job.description) : title;
      const postedAt = job.date ? new Date(job.date) : undefined;

      results.push({
        externalId,
        title,
        description,
        url,
        budget: buildBudget(job),
        tags: job.tags ?? [],
        country: job.location ?? "Remote",
        postedAt: postedAt && !isNaN(postedAt.getTime()) ? postedAt : undefined,
      });
    }

    console.log(`[remoteok] Found ${results.length} projects`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[remoteok] Blocked (${status}) — skipping`);
        return [];
      }
    }
    console.error("[remoteok] Fetch failed:", err);
  }

  return results;
}
