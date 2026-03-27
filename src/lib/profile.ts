import { prisma } from "@/lib/db";
import { CURRICULUM } from "@/data/curriculum";

// In-memory cache — avoids hitting the DB on every scoreProject() call
// during a scoring batch. Invalidated when profile settings change.
let cache: { context: string; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateProfileCache(): void {
  cache = null;
}

export async function getProfileContext(): Promise<string> {
  if (cache && Date.now() < cache.expiresAt) return cache.context;

  try {
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

    let context: string;

    if (skills.length === 0 && titles.length === 0) {
      context = CURRICULUM;
    } else {
      const additions: string[] = [];
      if (titles.length > 0) {
        additions.push(`## Target Job Titles (confirmed from resume)\n${titles.map((t) => `- ${t}`).join("\n")}`);
      }
      if (skills.length > 0) {
        additions.push(`## Confirmed Skills (from resume upload)\n${skills.map((s) => `- ${s}`).join("\n")}`);
      }
      context = `${CURRICULUM}\n\n${additions.join("\n\n")}`;
    }

    cache = { context, expiresAt: Date.now() + CACHE_TTL_MS };
    return context;
  } catch {
    return CURRICULUM;
  }
}
