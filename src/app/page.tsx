"use client";

import { useState, useRef, useMemo } from "react";
import { RefreshCw, Loader2, TrendingUp, Star, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/FilterBar";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCardList } from "@/components/ProjectCardList";
import { ProposalModal } from "@/components/ProposalModal";
import { useProjects } from "@/hooks/useProjects";
import { useCollect } from "@/hooks/useCollect";
import { useViewMode } from "@/hooks/useViewMode";
import { useSettings } from "@/hooks/useSettings";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Project } from "@/types/project";

export default function DashboardPage(): React.ReactElement {
  const { projects, filters, isLoading, setFilters, updateProject, reload } = useProjects(false, true);
  const { isCollecting, trigger, lastCollectedAt } = useCollect(reload);
  const { activePlatforms } = useSettings();
  const [proposalTarget, setProposalTarget] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useViewMode();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { visible, sentinelRef, hasMore } = useInfiniteScroll(projects, filters, scrollContainerRef);

  const stats = useMemo(() => {
    const scored = projects.filter((p) => p.matchScore !== null);
    const avgScore = scored.length > 0
      ? Math.round(scored.reduce((acc, p) => acc + (p.matchScore ?? 0), 0) / scored.length)
      : null;
    const withProposal = projects.filter((p) => p.proposalText).length;
    const concluded = projects.filter((p) => p.proposalStatus === "concluida");
    const totalValue = concluded.reduce((acc, p) => acc + (p.proposalValue ?? 0), 0);
    return { total: projects.length, avgScore, withProposal, totalValue };
  }, [projects]);

  function handleProposalSaved(projectId: string, proposalText: string): void {
    updateProject({ id: projectId, proposalText });
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          {lastCollectedAt && (
            <p className="text-xs text-muted-foreground">
              Última recopilación {lastCollectedAt.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => void trigger()}
          disabled={isCollecting}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${isCollecting ? "animate-spin" : ""}`} />
          {isCollecting ? "Recopilando..." : "Recopilar ahora"}
        </Button>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border-b border-border">
        <div className="flex items-center gap-3 px-5 py-3 bg-card">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <TrendingUp className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total proyectos</p>
            <p className="text-lg font-bold tabular-nums leading-none">{stats.total}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-card">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Star className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Score promedio</p>
            <p className="text-lg font-bold tabular-nums leading-none">
              {stats.avgScore !== null ? stats.avgScore : <span className="text-muted-foreground text-sm">—</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-card">
          <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Con propuesta</p>
            <p className="text-lg font-bold tabular-nums leading-none">{stats.withProposal}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-card">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
            <DollarSign className="size-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Facturado (USD)</p>
            <p className="text-lg font-bold tabular-nums leading-none">
              {stats.totalValue > 0 ? stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : <span className="text-muted-foreground text-sm">—</span>}
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        total={projects.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activePlatforms={activePlatforms}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {isLoading || isCollecting ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            {isCollecting ? "Recopilando nuevas oportunidades..." : "Cargando proyectos..."}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <p className="text-sm font-medium">No se encontraron proyectos</p>
            <p className="text-xs">Ajusta los filtros o recopila nuevas oportunidades</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col">
            {visible.map((project, i) => (
              <ProjectCardList
                key={project.id}
                project={project}
                onUpdate={updateProject}
                onViewDetails={setProposalTarget}
                index={i + 1}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-1" />
            {hasMore && (
              <div className="flex justify-center py-4 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdate={updateProject}
                onGenerateProposal={setProposalTarget}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="col-span-full h-1" />
            {hasMore && (
              <div className="col-span-full flex justify-center py-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <ProposalModal
        project={proposalTarget}
        onClose={() => setProposalTarget(null)}
        onProposalSaved={handleProposalSaved}
      />
    </div>
  );
}
