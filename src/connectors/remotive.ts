import axios from "axios";
import type { RawProject } from "./types";

// Remotive has a public JSON API — more reliable than RSS
const API_URL = "https://remotive.com/api/remote-jobs";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
}

export async function collect(): Promise<RawProject[]> {
  const results: RawProject[] = [];

  try {
    const response = await axios.get<RemotiveResponse>(API_URL, {
      params: { category: "software-dev", limit: 50 },
      headers: HEADERS,
      timeout: 15000,
    });

    const jobs = response.data?.jobs ?? [];

    for (const job of jobs) {
      results.push({
        externalId: String(job.id),
        title: job.title,
        description: stripHtml(job.description) || `${job.company_name} — ${job.category}`,
        url: job.url,
        budget: job.salary || undefined,
        tags: job.tags ?? [],
        country: job.candidate_required_location || "Remote",
        postedAt: job.publication_date ? new Date(job.publication_date) : undefined,
      });
    }

    console.log(`[remotive] Found ${results.length} jobs`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 403 || status === 429 || status === 401) {
        console.warn(`[remotive] Blocked (${status}) — skipping`);
        return [];
      }
    }
    console.error("[remotive] Fetch failed:", err);
  }

  return results;
}
