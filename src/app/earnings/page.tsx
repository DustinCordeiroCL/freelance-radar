"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import type { EarningsData } from "@/app/api/earnings/route";

const PLATFORM_COLORS: Record<string, string> = {
  workana: "#3b82f6",
  freelancer: "#f59e0b",
  "99freelas": "#10b981",
  indeed: "#8b5cf6",
  soyfreelancer: "#ef4444",
  upwork: "#06b6d4",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }): React.ReactElement {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value === 0) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function EarningsPage(): React.ReactElement {
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/earnings")
      .then((r) => r.json())
      .then((d) => setData(d as EarningsData))
      .catch(() => toast.error("Failed to load earnings data"))
      .finally(() => setIsLoading(false));
  }, []);

  // Collect all platform names that appear in monthly data
  const platformsInChart = data
    ? [...new Set(data.monthly.flatMap((m) => Object.keys(m.platforms)))]
    : [];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Earnings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin mr-2" /> Loading earnings...
          </div>
        ) : !data ? null : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Total earned"
                value={formatCurrency(data.summary.totalEarned)}
                sub={`from ${data.summary.completedCount} completed project${data.summary.completedCount !== 1 ? "s" : ""}`}
              />
              <StatCard
                label="Avg match score"
                value={data.summary.avgScore !== null ? `${data.summary.avgScore}` : "—"}
                sub="across all scored projects"
              />
              <StatCard
                label="Conversion rate"
                value={data.summary.conversionRate !== null ? `${data.summary.conversionRate}%` : "—"}
                sub="proposals → completed"
              />
              <StatCard
                label="Platforms used"
                value={String(data.byPlatform.length)}
                sub={data.byPlatform.map((p) => p.platform).join(", ") || "—"}
              />
            </div>

            {/* Monthly chart */}
            {data.monthly.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold mb-4">Monthly earnings by platform</h2>
                <div className="rounded-lg border border-border bg-card p-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={(v: number) => `$${v}`} />
                      <Tooltip
                        formatter={(value) => [formatCurrency(Number(value)), ""]}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {platformsInChart.map((platform) => (
                        <Bar
                          key={platform}
                          dataKey={`platforms.${platform}`}
                          name={platform}
                          stackId="a"
                          fill={PLATFORM_COLORS[platform] ?? "#94a3b8"}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ) : (
              <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center gap-2 text-muted-foreground">
                <p className="text-sm font-medium">No earnings data yet</p>
                <p className="text-xs">Mark projects as <strong>Concluída</strong> and set their value to see charts here</p>
              </div>
            )}

            {/* By platform breakdown */}
            {data.byPlatform.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-4">By platform</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {data.byPlatform.map((p) => (
                    <div key={p.platform} className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PLATFORM_COLORS[p.platform] ?? "#94a3b8" }}
                        />
                        <span className="text-xs font-medium capitalize">{p.platform}</span>
                      </div>
                      <p className="text-lg font-semibold">{p.count}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(p.total)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed projects list */}
            {data.projects.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-4">Completed projects</h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Project</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Platform</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Value</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Completed</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((p, i) => (
                        <tr
                          key={p.id}
                          className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                        >
                          <td className="px-4 py-2.5 max-w-xs">
                            <span className="line-clamp-1 text-sm">{p.title}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="capitalize text-xs text-muted-foreground">{p.platform}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium">
                            {p.proposalValue ? formatCurrency(p.proposalValue) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">
                            {p.statusUpdatedAt
                              ? formatDistanceToNow(new Date(p.statusUpdatedAt), { addSuffix: true })
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ExternalLink className="size-3.5" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
