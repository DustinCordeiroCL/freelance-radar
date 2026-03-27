"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/FilterBar";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCardList } from "@/components/ProjectCardList";
import { ProposalModal } from "@/components/ProposalModal";
import { useProjects } from "@/hooks/useProjects";
import { useCollect } from "@/hooks/useCollect";
import { useViewMode } from "@/hooks/useViewMode";
import type { Project } from "@/types/project";

export default function DashboardPage(): React.ReactElement {
  const { projects, filters, isLoading, setFilters, updateProject, reload } = useProjects();
  const { isCollecting, trigger, lastCollectedAt } = useCollect(reload);
  const [proposalTarget, setProposalTarget] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useViewMode();

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
              Last collected {lastCollectedAt.toLocaleTimeString()}
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
          {isCollecting ? "Collecting..." : "Collect now"}
        </Button>
      </header>

      <FilterBar
        filters={filters}
        onChange={setFilters}
        total={projects.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading || isCollecting ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            {isCollecting ? "Collecting new projects..." : "Loading projects..."}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-xs">Try adjusting filters or collect new opportunities</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col">
            {projects.map((project, i) => (
              <ProjectCardList
                key={project.id}
                project={project}
                onUpdate={updateProject}
                onViewDetails={setProposalTarget}
                index={i + 1}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdate={updateProject}
                onGenerateProposal={setProposalTarget}
              />
            ))}
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
