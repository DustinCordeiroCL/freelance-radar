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
  { value: "", label: "Sin estado" },
  { value: "em_negociacao", label: "En negociación" },
  { value: "em_desenvolvimento", label: "En desarrollo" },
  { value: "concluida", label: "Concluido" },
];

export function ProjectCardList({ project, onUpdate, onViewDetails, index }: ProjectCardListProps): React.ReactElement {
  const { isUpdating, toggleFavorite, toggleDiscard, handleStatusChange } =
    useProjectActions(project, onUpdate);

  const relativeTime = project.postedAt
    ? formatDistanceToNow(new Date(project.postedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(project.collectedAt), { addSuffix: true });

  return (
    <div className={`group flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card hover:bg-accent/40 transition-colors ${project.isDiscarded ? "opacity-40" : ""}`}>
      {/* Index */}
      {index !== undefined && (
        <span className="text-xs text-muted-foreground/40 w-5 text-right shrink-0 tabular-nums font-mono">{index}</span>
      )}

      {/* Score */}
      <div className="shrink-0 w-8 flex justify-center">
        <ScoreBadge score={project.matchScore} />
      </div>

      {/* Platform */}
      <div className="shrink-0 hidden sm:block">
        <PlatformBadge platform={project.platform} />
      </div>

      {/* Title + reason */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug line-clamp-1 group-hover:text-primary transition-colors">
          {project.title}
        </p>
        {project.scoreReason && (
          <p className="text-xs text-muted-foreground italic line-clamp-1 mt-0.5">{project.scoreReason}</p>
        )}
      </div>

      {/* Budget */}
      {project.budget && (
        <span className="text-xs font-semibold text-foreground/70 shrink-0 hidden md:block">{project.budget}</span>
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
        className="text-xs bg-muted border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shrink-0 hidden sm:block hover:border-primary/40 transition-colors cursor-pointer"
      >
        {STATUS_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Time */}
      <span className="text-xs text-muted-foreground/60 shrink-0 hidden xl:block">{relativeTime}</span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onViewDetails(project)}
          title="Ver propuesta"
          className={`p-1.5 rounded-lg transition-colors relative ${project.proposalText ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
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
          title="Abrir en la plataforma"
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="size-3.5" />
        </a>
        <button
          onClick={toggleFavorite}
          disabled={isUpdating}
          title={project.isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          className={`p-1.5 rounded-lg transition-colors ${project.isFavorite ? "text-amber-500" : "text-muted-foreground hover:text-amber-500 hover:bg-muted"}`}
        >
          <Star className={`size-3.5 ${project.isFavorite ? "fill-amber-500" : ""}`} />
        </button>
        <button
          onClick={toggleDiscard}
          disabled={isUpdating}
          title={project.isDiscarded ? "Restaurar proyecto" : "Descartar proyecto"}
          className={`p-1.5 rounded-lg transition-colors ${project.isDiscarded ? "text-destructive" : "text-muted-foreground hover:text-destructive hover:bg-muted"}`}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
