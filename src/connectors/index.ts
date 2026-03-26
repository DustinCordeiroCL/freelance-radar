import { prisma } from "@/lib/db";
import { collect as collectWorkana } from "./workana";
import { collect as collectNinetyNine } from "./ninetyNine";
import { collect as collectFreelancer } from "./freelancer";
import { collect as collectIndeed } from "./indeed";
import type { RawProject } from "./types";

export interface CollectResult {
  platform: string;
  collected: number;
  saved: number;
  error?: string;
}

async function ensureSettings(): Promise<void> {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
}

async function saveProjects(platform: string, projects: RawProject[]): Promise<number> {
  let saved = 0;

  for (const project of projects) {
    const existing = await prisma.project.findUnique({
      where: { platform_externalId: { platform, externalId: project.externalId } },
    });

    if (existing) continue;

    await prisma.project.create({
      data: {
        platform,
        externalId: project.externalId,
        title: project.title,
        description: project.description,
        url: project.url,
        budget: project.budget,
        category: project.category,
        tags: project.tags ? JSON.stringify(project.tags) : null,
        country: project.country,
        postedAt: project.postedAt,
      },
    });

    saved++;
  }

  return saved;
}

export async function runCollection(): Promise<CollectResult[]> {
  await ensureSettings();

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  if (!settings) return [];

  const connectors: Array<{
    platform: string;
    active: boolean;
    fn: () => Promise<RawProject[]>;
  }> = [
    { platform: "workana", active: settings.activeWorkana, fn: collectWorkana },
    { platform: "99freelas", active: settings.active99Freelas, fn: collectNinetyNine },
    { platform: "freelancer", active: settings.activeFreelancer, fn: collectFreelancer },
    { platform: "indeed", active: settings.activeIndeed, fn: collectIndeed },
  ];

  const results: CollectResult[] = [];

  for (const { platform, active, fn } of connectors) {
    if (!active) {
      console.log(`[collect] ${platform} is disabled — skipping`);
      continue;
    }

    console.log(`[collect] Starting ${platform}...`);

    try {
      const projects = await fn();
      const saved = await saveProjects(platform, projects);

      console.log(`[collect] ${platform}: collected ${projects.length}, saved ${saved} new`);

      results.push({ platform, collected: projects.length, saved });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[collect] ${platform} failed:`, message);
      results.push({ platform, collected: 0, saved: 0, error: message });
    }
  }

  return results;
}
