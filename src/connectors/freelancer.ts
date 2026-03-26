import axios from "axios";
import type { RawProject } from "./types";

const API_BASE = "https://www.freelancer.com/api/projects/0.1";

// Freelancer skill IDs for relevant technologies
// https://www.freelancer.com/api/projects/0.1/skills
const RELEVANT_SKILL_IDS = [
  3,    // JavaScript
  175,  // TypeScript
  9,    // React
  11,   // Angular
  13,   // Java
  128,  // PHP
  14,   // Node.js
  17,   // HTML
  19,   // CSS
  294,  // Spring
  167,  // Laravel
  97,   // Kotlin
];

interface FreelancerProject {
  id: number;
  title: string;
  description: string;
  seo_url: string;
  budget: { minimum: number | null; maximum: number | null; currency_code: string | null };
  jobs: Array<{ name: string }>;
  submitdate: number;
}

interface FreelancerApiResponse {
  status: string;
  result: {
    projects: FreelancerProject[];
  };
}

function formatBudget(budget: FreelancerProject["budget"]): string | undefined {
  if (budget.minimum == null && budget.maximum == null) return undefined;
  const currency = budget.currency_code ?? "USD";
  if (budget.minimum != null && budget.maximum != null) {
    return `${currency} ${budget.minimum}–${budget.maximum}`;
  }
  return `${currency} ${budget.minimum ?? budget.maximum}`;
}

export async function collect(): Promise<RawProject[]> {
  const token = process.env.FREELANCER_API_TOKEN;

  if (!token) {
    console.warn("[freelancer] FREELANCER_API_TOKEN not set — skipping");
    return [];
  }

  try {
    const response = await axios.get<FreelancerApiResponse>(
      `${API_BASE}/projects/active`,
      {
        params: {
          job_ids: RELEVANT_SKILL_IDS.join(","),
          limit: 50,
          full_description: true,
        },
        headers: {
          "freelancer-oauth-v1": token,
        },
        timeout: 10000,
      }
    );

    const projects = response.data?.result?.projects ?? [];

    return projects.map((p) => ({
      externalId: String(p.id),
      title: p.title,
      description: p.description ?? "",
      url: `https://www.freelancer.com/projects/${p.seo_url}`,
      budget: formatBudget(p.budget),
      tags: p.jobs?.map((j) => j.name) ?? [],
      postedAt: p.submitdate ? new Date(p.submitdate * 1000) : undefined,
    }));
  } catch (err) {
    console.error("[freelancer] API request failed:", err);
    return [];
  }
}
