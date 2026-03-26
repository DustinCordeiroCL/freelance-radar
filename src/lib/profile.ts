import { prisma } from "@/lib/db";
import { CURRICULUM } from "@/data/curriculum";

export async function getProfileContext(): Promise<string> {
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

    if (skills.length === 0 && titles.length === 0) {
      return CURRICULUM;
    }

    const additions: string[] = [];

    if (titles.length > 0) {
      additions.push(`## Target Job Titles (confirmed from resume)\n${titles.map((t) => `- ${t}`).join("\n")}`);
    }

    if (skills.length > 0) {
      additions.push(`## Confirmed Skills (from resume upload)\n${skills.map((s) => `- ${s}`).join("\n")}`);
    }

    return `${CURRICULUM}\n\n${additions.join("\n\n")}`;
  } catch {
    return CURRICULUM;
  }
}
