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
  upwork: "#14a800",
  remoteok: "#ff4c29",
  weworkremotely: "#1a1a2e",
  remotive: "#6366f1",
  trampos: "#f59e0b",
  torre: "#0ea5e9",
  guru: "#10b981",
  freelancer: "#0088cc",
  workana: "#3b82f6",
  "99freelas": "#8b5cf6",
  indeed: "#2164f3",
  soyfreelancer: "#ef4444",
  programathor: "#e11d48",
  getonboard: "#059669",
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
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((d) => setData(d as EarningsData))
      .catch(() => toast.error("Error al cargar los datos de ganancias"))
      .finally(() => setIsLoading(false));
  }, []);

  // Collect all platform names that appear in monthly data
  const platformsInChart = data?.monthly
    ? [...new Set(data.monthly.flatMap((m) => Object.keys(m.platforms)))]
    : [];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Ganancias</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin mr-2" /> Cargando ganancias...
          </div>
        ) : !data ? null : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Total ganado"
                value={formatCurrency(data.summary.totalEarned)}
                sub={`de ${data.summary.completedCount} proyecto${data.summary.completedCount !== 1 ? "s" : ""} completado${data.summary.completedCount !== 1 ? "s" : ""}`}
              />
              <StatCard
                label="Score promedio"
                value={data.summary.avgScore !== null ? `${data.summary.avgScore}` : "—"}
                sub="en todos los proyectos con score"
              />
              <StatCard
                label="Tasa de conversión"
                value={data.summary.conversionRate !== null ? `${data.summary.conversionRate}%` : "—"}
                sub="propuestas → completados"
              />
              <StatCard
                label="Plataformas usadas"
                value={String(data.byPlatform.length)}
                sub={data.byPlatform.map((p) => p.platform).join(", ") || "—"}
              />
            </div>

            {/* Monthly chart */}
            {data.monthly.length > 0 ? (
              <section>
                <h2 className="text-sm font-semibold mb-4">Ganancias mensuales por plataforma</h2>
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
                <p className="text-sm font-medium">Aún no hay datos de ganancias</p>
                <p className="text-xs">Marca proyectos como <strong>Concluido</strong> y define su valor para ver gráficos aquí</p>
              </div>
            )}

            {/* By platform breakdown */}
            {data.byPlatform.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-4">Por plataforma</h2>
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
                <h2 className="text-sm font-semibold mb-4">Proyectos completados</h2>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Proyecto</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Plataforma</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Valor</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Completado</th>
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
