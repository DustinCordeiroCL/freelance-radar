"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/FilterBar";
import { ProjectCard } from "@/components/ProjectCard";
import { useProjects } from "@/hooks/useProjects";
import { useCollect } from "@/hooks/useCollect";
import type { Project } from "@/types/project";

export default function DashboardPage(): React.ReactElement {
  const { projects, filters, isLoading, setFilters, updateProject, reload } = useProjects();
  const { isCollecting, trigger, lastCollectedAt } = useCollect(reload);
  const [proposalTarget, setProposalTarget] = useState<Project | null>(null);

  // Suppress unused for now — ProposalModal comes in Etapa 6
  void proposalTarget;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Project list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-xs">Try adjusting filters or collect new opportunities</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
    </div>
  );
}
