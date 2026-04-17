"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ExternalLink, TrendingUp, Star, ArrowUpRight, BarChart2 } from "lucide-react";
import { formatDistanceToNow, parse, format } from "date-fns";
import { es } from "date-fns/locale";

function formatMonth(yyyyMM: string): string {
  try {
    return format(parse(yyyyMM, "yyyy-MM", new Date()), "MMM yyyy", { locale: es });
  } catch {
    return yyyyMM;
  }
}
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { PlatformBadge } from "@/components/PlatformBadge";
import type { EarningsData } from "@/app/api/earnings/route";


interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactElement;
  iconBg: string;
}

function StatCard({ label, value, sub, icon, iconBg }: StatCardProps): React.ReactElement {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value === 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}


export default function EarningsPage(): React.ReactElement {
  const [data, setData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/earnings")
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => setData(d as EarningsData))
      .catch(() => toast.error("Error al cargar los datos de ganancias"))
      .finally(() => setIsLoading(false));
  }, []);

  const monthlyTotals = data?.monthly.map((m) => ({
    month: m.month,
    total: Object.values(m.platforms).reduce((a, b) => a + b, 0),
  })) ?? [];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Ganancias</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin mr-2" /> Cargando ganancias...
          </div>
        ) : !data ? null : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <StatCard
                label="Total ganado"
                value={formatCurrency(data.summary.totalEarned)}
                sub={`${data.summary.completedCount} proyecto${data.summary.completedCount !== 1 ? "s" : ""} completado${data.summary.completedCount !== 1 ? "s" : ""}`}
                icon={<TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />}
                iconBg="bg-emerald-500/10"
              />
              <StatCard
                label="Score promedio"
                value={data.summary.avgScore !== null ? String(data.summary.avgScore) : "—"}
                sub="en proyectos con score"
                icon={<Star className="size-4 text-amber-500" />}
                iconBg="bg-amber-500/10"
              />
              <StatCard
                label="Tasa de conversión"
                value={data.summary.conversionRate !== null ? `${data.summary.conversionRate}%` : "—"}
                sub="propuestas → completados"
                icon={<ArrowUpRight className="size-4 text-primary" />}
                iconBg="bg-primary/10"
              />
              <StatCard
                label="Plataformas usadas"
                value={String(data.byPlatform.length)}
                sub={data.byPlatform.map((p) => p.platform).join(", ") || "—"}
                icon={<BarChart2 className="size-4 text-violet-500" />}
                iconBg="bg-violet-500/10"
              />
            </div>

            {/* Monthly chart */}
            {data.monthly.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold mb-3">Evolución de ganancias</h2>
                <div className="rounded-xl border border-border bg-card p-5">
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={monthlyTotals} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.55 0.22 285)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="oklch(0.55 0.22 285)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={formatMonth}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-lg border border-border bg-popover shadow-lg p-3 text-xs">
                              <p className="font-semibold text-foreground mb-1">{formatMonth(label as string)}</p>
                              <p className="text-primary font-bold">{formatCurrency(payload[0]?.value as number ?? 0)}</p>
                            </div>
                          );
                        }}
                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="oklch(0.55 0.22 285)"
                        strokeWidth={2}
                        fill="url(#earningsGradient)"
                        dot={{ r: 3, fill: "oklch(0.55 0.22 285)", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "oklch(0.55 0.22 285)", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            ) : (
              <div className="rounded-xl border border-border bg-card p-8 flex flex-col items-center gap-2 text-muted-foreground">
                <p className="text-sm font-medium">Aún no hay datos de ganancias</p>
                <p className="text-xs">Marca proyectos como <strong>Concluido</strong> y define su valor para ver gráficos aquí</p>
              </div>
            )}

            {/* By platform breakdown */}
            {data.byPlatform.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-3">Por plataforma</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {data.byPlatform.map((p) => (
                    <div key={p.platform} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
                      <PlatformBadge platform={p.platform} />
                      <div>
                        <p className="text-2xl font-bold tabular-nums leading-tight">{p.count}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(p.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Completed projects list */}
            {data.projects.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-3">Proyectos completados</h2>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Proyecto</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Plataforma</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Valor</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Completado</th>
                        <th className="px-4 py-2.5 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.projects.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-2.5 max-w-xs">
                            <span className="line-clamp-1 text-sm">{p.title}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <PlatformBadge platform={p.platform} />
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                            {p.proposalValue ? formatCurrency(p.proposalValue) : <span className="text-muted-foreground font-normal">—</span>}
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
