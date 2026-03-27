import { prisma } from "@/lib/db";
import { enqueueScore } from "@/lib/scoringQueue";
import { collect as collectWorkana } from "./workana";
import { collect as collectNinetyNine } from "./ninetyNine";
import { collect as collectFreelancer } from "./freelancer";
import { collect as collectIndeed } from "./indeed";
import { collect as collectSoyFreelancer } from "./soyfreelancer";
import { collect as collectUpwork } from "./upwork";
import type { RawProject } from "./types";

export interface CollectResult {
  platform: string;
  collected: number;
  saved: number;
  skipped: number;
  error?: string;
}

async function ensureSettings(): Promise<void> {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

async function getProfileKeywords(): Promise<string[]> {
  const settings = await prisma.settings.findUnique({
    where: { id: 1 },
    select: { profileSkills: true, profileTitles: true },
  });
  const skills: string[] = settings?.profileSkills
    ? (JSON.parse(settings.profileSkills) as string[])
    : [];
  const titles: string[] = settings?.profileTitles
    ? (JSON.parse(settings.profileTitles) as string[])
    : [];
  return [...skills, ...titles];
}

function isRelevant(project: RawProject, keywords: string[]): boolean {
  if (keywords.length === 0) return true;

  const searchText = [project.title, project.description, ...(project.tags ?? [])]
    .join(" ")
    .toLowerCase();

  return keywords.some((kw) => searchText.includes(kw.toLowerCase()));
}

async function saveProjects(
  platform: string,
  projects: RawProject[],
  keywords: string[]
): Promise<{ saved: number; skipped: number }> {
  const relevant = projects.filter((p) => p.preFiltered || isRelevant(p, keywords));
  const skipped = projects.length - relevant.length;

  if (relevant.length === 0) return { saved: 0, skipped };

  // 1. Batch-check which externalIds already exist — 1 query instead of N
  const incomingIds = relevant.map((p) => p.externalId);
  const existing = await prisma.project.findMany({
    where: { platform, externalId: { in: incomingIds } },
    select: { externalId: true },
  });
  const existingSet = new Set(existing.map((e) => e.externalId));

  const newProjects = relevant.filter((p) => !existingSet.has(p.externalId));
  if (newProjects.length === 0) return { saved: 0, skipped };

  // 2. Batch insert — 1 query instead of N
  await prisma.project.createMany({
    data: newProjects.map((p) => ({
      platform,
      externalId: p.externalId,
      title: p.title,
      description: p.description,
      url: p.url,
      budget: p.budget ?? null,
      category: p.category ?? null,
      tags: p.tags ? JSON.stringify(p.tags) : null,
      country: p.country ?? null,
      postedAt: p.postedAt ?? null,
    })),
    skipDuplicates: true,
  });

  // 3. Fetch inserted IDs to enqueue scoring (createMany doesn't return records)
  const inserted = await prisma.project.findMany({
    where: { platform, externalId: { in: newProjects.map((p) => p.externalId) } },
    select: { id: true },
  });
  for (const { id } of inserted) enqueueScore(id);

  return { saved: newProjects.length, skipped };
}

async function requeueStuckProjects(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const dbKey = await prisma.settings.findUnique({ where: { id: 1 }, select: { anthropicKey: true } });
  if (!apiKey && !dbKey?.anthropicKey) return; // no key — skip

  const stuck = await prisma.project.findMany({
    where: { matchScore: null },
    select: { id: true },
    orderBy: { collectedAt: "desc" },
    take: 50, // cap to avoid overwhelming the queue
  });

  if (stuck.length > 0) {
    console.log(`[collect] Re-queuing ${stuck.length} stuck projects for scoring`);
    for (const { id } of stuck) {
      enqueueScore(id);
    }
  }
}

export async function runCollection(): Promise<CollectResult[]> {
  await ensureSettings();

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return [];

  // Re-queue any projects that got stuck with null score from previous runs
  void requeueStuckProjects();

  const keywords = await getProfileKeywords();

  if (keywords.length > 0) {
    console.log(`[collect] Profile filter active — ${keywords.length} keywords`);
  }

  const connectors: Array<{
    platform: string;
    active: boolean;
    fn: (keywords: string[]) => Promise<RawProject[]>;
  }> = [
    { platform: "workana", active: settings.activeWorkana, fn: () => collectWorkana() },
    { platform: "99freelas", active: settings.active99Freelas, fn: () => collectNinetyNine() },
    { platform: "freelancer", active: settings.activeFreelancer, fn: () => collectFreelancer() },
    { platform: "indeed", active: settings.activeIndeed, fn: () => collectIndeed() },
    { platform: "soyfreelancer", active: settings.activeSoyFreelancer, fn: (kw) => collectSoyFreelancer(kw) },
    { platform: "upwork", active: settings.activeUpwork, fn: (kw) => collectUpwork(kw) },
  ];

  const results: CollectResult[] = [];

  for (const { platform, active, fn } of connectors) {
    if (!active) {
      console.log(`[collect] ${platform} is disabled — skipping`);
      continue;
    }

    console.log(`[collect] Starting ${platform}...`);

    try {
      const projects = await fn(keywords);
      const { saved, skipped } = await saveProjects(platform, projects, keywords);

      console.log(
        `[collect] ${platform}: collected ${projects.length}, saved ${saved} new, skipped ${skipped} irrelevant`
      );

      results.push({ platform, collected: projects.length, saved, skipped });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[collect] ${platform} failed:`, message);
      results.push({ platform, collected: 0, saved: 0, skipped: 0, error: message });
    }
  }

  return results;
}
