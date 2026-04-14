"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FilterBar } from "@/components/FilterBar";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCardList } from "@/components/ProjectCardList";
import { ProposalModal } from "@/components/ProposalModal";
import { useProjects } from "@/hooks/useProjects";
import { useViewMode } from "@/hooks/useViewMode";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Project } from "@/types/project";

export default function FavoritesPage(): React.ReactElement {
  const { projects, filters, isLoading, setFilters, updateProject } = useProjects(true);
  const [proposalTarget, setProposalTarget] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useViewMode();
  const { visible, sentinelRef, hasMore } = useInfiniteScroll(projects, filters);

  function handleProposalSaved(projectId: string, proposalText: string): void {
    updateProject({ id: projectId, proposalText });
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center px-6 py-4 border-b border-border bg-card">
        <h1 className="text-lg font-semibold">Favoritos</h1>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        total={projects.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Cargando favoritos...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <p className="text-sm font-medium">Aún no hay favoritos</p>
            <p className="text-xs">Marca proyectos con estrella en el dashboard para verlos aquí</p>
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
