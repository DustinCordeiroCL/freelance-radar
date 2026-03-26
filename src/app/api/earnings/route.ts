import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface MonthlyEntry {
  month: string;
  total: number;
  count: number;
  platforms: Record<string, number>;
}

interface PlatformEntry {
  platform: string;
  count: number;
  total: number;
}

export interface EarningsData {
  summary: {
    totalEarned: number;
    completedCount: number;
    avgScore: number | null;
    conversionRate: number | null;
  };
  monthly: MonthlyEntry[];
  byPlatform: PlatformEntry[];
  projects: Array<{
    id: string;
    title: string;
    platform: string;
    proposalValue: number | null;
    statusUpdatedAt: string | null;
    url: string;
    matchScore: number | null;
  }>;
}

export async function GET(): Promise<NextResponse> {
  try {
    const [completed, allWithStatus, avgScoreResult] = await Promise.all([
      prisma.project.findMany({
        where: { proposalStatus: "concluida" },
        select: {
          id: true,
          title: true,
          platform: true,
          proposalValue: true,
          statusUpdatedAt: true,
          url: true,
          matchScore: true,
        },
        orderBy: { statusUpdatedAt: "desc" },
      }),
      prisma.project.count({
        where: { proposalStatus: { not: null } },
      }),
      prisma.project.aggregate({
        _avg: { matchScore: true },
        where: { matchScore: { not: null } },
      }),
    ]);

    const totalEarned = completed.reduce((sum, p) => sum + (p.proposalValue ?? 0), 0);
    const conversionRate =
      allWithStatus > 0 ? Math.round((completed.length / allWithStatus) * 100) : null;
    const avgScore = avgScoreResult._avg.matchScore
      ? Math.round(avgScoreResult._avg.matchScore)
      : null;

    // Monthly breakdown
    const monthlyMap = new Map<string, MonthlyEntry>();
    for (const p of completed) {
      const date = p.statusUpdatedAt ? new Date(p.statusUpdatedAt) : null;
      if (!date) continue;
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(month) ?? { month, total: 0, count: 0, platforms: {} };
      entry.total += p.proposalValue ?? 0;
      entry.count += 1;
      entry.platforms[p.platform] = (entry.platforms[p.platform] ?? 0) + (p.proposalValue ?? 0);
      monthlyMap.set(month, entry);
    }
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // By platform breakdown
    const platformMap = new Map<string, PlatformEntry>();
    for (const p of completed) {
      const entry = platformMap.get(p.platform) ?? { platform: p.platform, count: 0, total: 0 };
      entry.count += 1;
      entry.total += p.proposalValue ?? 0;
      platformMap.set(p.platform, entry);
    }
    const byPlatform = Array.from(platformMap.values()).sort((a, b) => b.count - a.count);

    const data: EarningsData = {
      summary: {
        totalEarned,
        completedCount: completed.length,
        avgScore,
        conversionRate,
      },
      monthly,
      byPlatform,
      projects: completed.map((p) => ({
        ...p,
        statusUpdatedAt: p.statusUpdatedAt?.toISOString() ?? null,
      })),
    };

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
