import { prisma } from "@/lib/db";
import { enqueueScore } from "@/lib/scoringQueue";
import { collect as collectWorkana } from "./workana";
import { collect as collectNinetyNine } from "./ninetyNine";
import { collect as collectFreelancer } from "./freelancer";
import { collect as collectIndeed } from "./indeed";
import { collect as collectSoyFreelancer } from "./soyfreelancer";
import { collect as collectUpwork } from "./upwork";
import { collect as collectRemoteOK } from "./remoteok";
import { collect as collectWeWorkRemotely } from "./weworkremotely";
import { collect as collectRemotive } from "./remotive";
import { collect as collectTrampos } from "./trampos";
import { collect as collectTorre } from "./torre";
import { collect as collectGetOnBoard } from "./getonboard";
import { collect as collectProgramathor } from "./programathor";
import { collect as collectGuru } from "./guru";
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

interface ProfileKeywords {
  include: string[];
  exclude: string[];
}

async function getProfileKeywords(): Promise<ProfileKeywords> {
  const settings = await prisma.settings.findUnique({
    where: { id: 1 },
    select: { profileSkills: true, profileTitles: true, excludeKeywords: true },
  });
  const skills: string[] = settings?.profileSkills
    ? (JSON.parse(settings.profileSkills) as string[])
    : [];
  const titles: string[] = settings?.profileTitles
    ? (JSON.parse(settings.profileTitles) as string[])
    : [];
  const exclude: string[] = settings?.excludeKeywords
    ? (JSON.parse(settings.excludeKeywords) as string[])
    : [];
  return { include: [...skills, ...titles], exclude };
}

function isRelevant(project: RawProject, { include, exclude }: ProfileKeywords): boolean {
  const searchText = [project.title, project.description, ...(project.tags ?? [])]
    .join(" ")
    .toLowerCase();

  if (exclude.length > 0 && exclude.some((kw) => searchText.includes(kw.toLowerCase()))) {
    return false;
  }

  if (include.length === 0) return true;
  return include.some((kw) => searchText.includes(kw.toLowerCase()));
}

async function saveProjects(
  platform: string,
  projects: RawProject[],
  keywords: ProfileKeywords,
  apiKey = ""
): Promise<{ saved: number; skipped: number }> {
  const relevant = projects.filter((p) => p.preFiltered || isRelevant(p, keywords));
  const skipped = projects.length - relevant.length;

  if (relevant.length === 0) return { saved: 0, skipped };

  // Deduplicate within the incoming batch — some feeds (e.g. WWR) return the same
  // job multiple times. createMany without skipDuplicates would fail on unique constraint.
  const seenInBatch = new Set<string>();
  const deduped = relevant.filter((p) => {
    if (seenInBatch.has(p.externalId)) return false;
    seenInBatch.add(p.externalId);
    return true;
  });

  // 1. Batch-check which externalIds already exist — 1 query instead of N
  const incomingIds = deduped.map((p) => p.externalId);
  const existing = await prisma.project.findMany({
    where: { platform, externalId: { in: incomingIds } },
    select: { externalId: true },
  });
  const existingSet = new Set(existing.map((e) => e.externalId));

  const newProjects = deduped.filter((p) => !existingSet.has(p.externalId));
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
  });

  // 3. Fetch inserted IDs to enqueue scoring (createMany doesn't return records)
  const inserted = await prisma.project.findMany({
    where: { platform, externalId: { in: newProjects.map((p) => p.externalId) } },
    select: { id: true },
  });
  for (const { id } of inserted) enqueueScore(id, apiKey);

  return { saved: newProjects.length, skipped };
}

async function requeueStuckProjects(apiKey: string): Promise<void> {
  if (!apiKey.trim()) return;

  const stuck = await prisma.project.findMany({
    where: { matchScore: null },
    select: { id: true },
    orderBy: { collectedAt: "desc" },
    take: 50,
  });

  if (stuck.length > 0) {
    console.log(`[collect] Re-queuing ${stuck.length} stuck projects for scoring`);
    for (const { id } of stuck) {
      enqueueScore(id, apiKey);
    }
  }
}

export async function runCollection(apiKey = ""): Promise<CollectResult[]> {
  await ensureSettings();

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return [];

  const resolvedKey = apiKey.trim() || process.env.ANTHROPIC_API_KEY?.trim() || "";
  void requeueStuckProjects(resolvedKey);

  const profileKeywords = await getProfileKeywords();

  if (profileKeywords.include.length > 0) {
    console.log(`[collect] Profile filter active — ${profileKeywords.include.length} keywords`);
  }
  if (profileKeywords.exclude.length > 0) {
    console.log(`[collect] Blacklist active — ${profileKeywords.exclude.length} excluded keywords`);
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
    { platform: "remoteok", active: settings.activeRemoteOK, fn: () => collectRemoteOK() },
    { platform: "weworkremotely", active: settings.activeWeWorkRemotely, fn: () => collectWeWorkRemotely() },
    { platform: "remotive", active: settings.activeRemotive, fn: () => collectRemotive() },
    { platform: "trampos", active: settings.activeTrampos, fn: (kw) => collectTrampos(kw) },
    { platform: "torre", active: settings.activeTorre, fn: (kw) => collectTorre(kw) },
    { platform: "getonboard", active: settings.activeGetOnBoard, fn: (kw) => collectGetOnBoard(kw) },
    { platform: "programathor", active: settings.activeProgramathor, fn: (kw) => collectProgramathor(kw) },
    { platform: "guru", active: settings.activeGuru, fn: () => collectGuru() },
  ];

  const active = connectors.filter(({ active }) => {
    return active;
  });

  const disabled = connectors.filter(({ active }) => !active);
  for (const { platform } of disabled) {
    console.log(`[collect] ${platform} is disabled — skipping`);
  }

  const settled = await Promise.allSettled(
    active.map(async ({ platform, fn }) => {
      console.log(`[collect] Starting ${platform}...`);
      const projects = await fn(profileKeywords.include);
      const { saved, skipped } = await saveProjects(platform, projects, profileKeywords, resolvedKey);
      console.log(
        `[collect] ${platform}: collected ${projects.length}, saved ${saved} new, skipped ${skipped} irrelevant`
      );
      return { platform, collected: projects.length, saved, skipped } satisfies CollectResult;
    })
  );

  const results: CollectResult[] = settled.map((result, i) => {
    if (result.status === "fulfilled") return result.value;
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    console.error(`[collect] ${active[i]!.platform} failed:`, message);
    return { platform: active[i]!.platform, collected: 0, saved: 0, skipped: 0, error: message };
  });

  return results;
}
