"use client";

import { useState, useRef } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
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
