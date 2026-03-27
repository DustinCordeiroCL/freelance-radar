"use client";

import { formatDistanceToNow } from "date-fns";
import { Star, Trash2, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { PlatformBadge } from "./PlatformBadge";
import { StatusBadge } from "./StatusBadge";
import { useProjectActions } from "@/hooks/useProjectActions";
import type { Project, ProposalStatus } from "@/types/project";

interface ProjectCardListProps {
  project: Project;
  onUpdate: (updated: Partial<Project> & { id: string }) => void;
  onViewDetails: (project: Project) => void;
  index?: number;
}

const STATUS_OPTIONS: Array<{ value: ProposalStatus | ""; label: string }> = [
  { value: "", label: "No status" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "em_desenvolvimento", label: "Em desenvolvimento" },
  { value: "concluida", label: "Concluída" },
];

export function ProjectCardList({ project, onUpdate, onViewDetails, index }: ProjectCardListProps): React.ReactElement {
  const { isUpdating, toggleFavorite, toggleDiscard, handleStatusChange } =
    useProjectActions(project, onUpdate);

  const relativeTime = project.postedAt
    ? formatDistanceToNow(new Date(project.postedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(project.collectedAt), { addSuffix: true });

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-border bg-card hover:bg-accent/30 transition-colors ${project.isDiscarded ? "opacity-50" : ""}`}>
      {/* Row number */}
      {index !== undefined && (
        <span className="text-xs text-muted-foreground/50 w-6 text-right shrink-0 tabular-nums">{index}</span>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        <PlatformBadge platform={project.platform} />
        <ScoreBadge score={project.matchScore} />
      </div>

      {/* Title + reason */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-1">{project.title}</p>
        {project.scoreReason && (
          <p className="text-xs text-muted-foreground italic line-clamp-1">{project.scoreReason}</p>
        )}
      </div>

      {/* Budget */}
      {project.budget && (
        <span className="text-xs font-medium text-foreground/80 shrink-0 hidden md:block">{project.budget}</span>
      )}

      {/* Status badge */}
      <div className="shrink-0 hidden lg:block">
        <StatusBadge status={project.proposalStatus} />
      </div>

      {/* Status select */}
      <select
        value={project.proposalStatus ?? ""}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
        className="text-xs bg-background border border-border rounded px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0 hidden sm:block"
      >
        {STATUS_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Time */}
      <span className="text-xs text-muted-foreground shrink-0 hidden xl:block">{relativeTime}</span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onViewDetails(project)}
          title="View project details"
          className={`p-1.5 rounded hover:bg-accent transition-colors relative ${project.proposalText ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <FileText className="size-3.5" />
          {project.proposalText && (
            <CheckCircle2 className="size-2 absolute -top-0.5 -right-0.5 fill-primary text-primary-foreground" />
          )}
        </button>
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open on platform"
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="size-3.5" />
        </a>
        <button
          onClick={toggleFavorite}
          disabled={isUpdating}
          title={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
          className={`p-1.5 rounded hover:bg-accent transition-colors ${project.isFavorite ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Star className={`size-3.5 ${project.isFavorite ? "fill-yellow-500" : ""}`} />
        </button>
        <button
          onClick={toggleDiscard}
          disabled={isUpdating}
          title={project.isDiscarded ? "Restore project" : "Discard project"}
          className={`p-1.5 rounded hover:bg-accent transition-colors ${project.isDiscarded ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
