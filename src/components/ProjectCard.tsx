"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, Trash2, ExternalLink, FileText, CheckCircle2, DollarSign, Clock } from "lucide-react";
import { ScoreBadge } from "./ScoreBadge";
import { PlatformBadge } from "./PlatformBadge";
import { StatusBadge } from "./StatusBadge";
import { useProjectActions } from "@/hooks/useProjectActions";
import type { Project, ProposalStatus } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onUpdate: (updated: Partial<Project> & { id: string }) => void;
  onGenerateProposal: (project: Project) => void;
}

const STATUS_OPTIONS: Array<{ value: ProposalStatus | ""; label: string }> = [
  { value: "", label: "Sin estado" },
  { value: "em_negociacao", label: "En negociación" },
  { value: "em_desenvolvimento", label: "En desarrollo" },
  { value: "concluida", label: "Concluido" },
];

export function ProjectCard({ project, onUpdate, onGenerateProposal }: ProjectCardProps): React.ReactElement {
  const [valueInput, setValueInput] = useState(project.proposalValue ? String(project.proposalValue) : "");
  const { isUpdating, toggleFavorite, toggleDiscard, handleStatusChange, handleValueSave } =
    useProjectActions(project, onUpdate);

  const tags: string[] = project.tags ? (JSON.parse(project.tags) as string[]) : [];

  const relativeTime = project.postedAt
    ? formatDistanceToNow(new Date(project.postedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(project.collectedAt), { addSuffix: true });

  return (
    <div className={`group rounded-xl border border-border bg-card p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 ${project.isDiscarded ? "opacity-40" : ""}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <PlatformBadge platform={project.platform} />
          <ScoreBadge score={project.matchScore} />
          {project.proposalStatus && <StatusBadge status={project.proposalStatus} />}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <Clock className="size-3" />
          <span className="text-xs">{relativeTime}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
        {project.title}
      </h3>

      {/* Score reason */}
      {project.scoreReason && (
        <p className="text-xs text-muted-foreground italic line-clamp-2 leading-relaxed">
          {project.scoreReason}
        </p>
      )}

      {/* Budget */}
      {project.budget && (
        <div className="flex items-center gap-1.5">
          <DollarSign className="size-3 text-muted-foreground" />
          <p className="text-xs font-semibold text-foreground">{project.budget}</p>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 5).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded-md text-xs bg-muted text-muted-foreground border border-border/50">
              {tag}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="px-1.5 py-0.5 rounded-md text-xs text-muted-foreground">
              +{tags.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Value input */}
      {project.proposalStatus === "concluida" && (
        <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
          <DollarSign className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <input
            type="number"
            min={0}
            step={0.01}
            value={valueInput}
            onChange={(e) => setValueInput(e.target.value)}
            onBlur={() => void handleValueSave(valueInput, project.proposalStatus ?? null)}
            placeholder="Valor del proyecto"
            className="flex-1 text-xs bg-transparent text-emerald-700 dark:text-emerald-300 placeholder-emerald-400 focus:outline-none"
          />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">USD</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
        <select
          value={project.proposalStatus ?? ""}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className="text-xs bg-muted border border-border rounded-md px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary/40 transition-colors"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => onGenerateProposal(project)}
            title="Ver propuesta"
            className={`p-1.5 rounded-lg transition-colors relative ${project.proposalText ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          >
            <FileText className="size-3.5" />
            {project.proposalText && (
              <CheckCircle2 className="size-2.5 absolute -top-0.5 -right-0.5 fill-primary text-primary-foreground" />
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
            className={`p-1.5 rounded-lg transition-colors ${project.isFavorite ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30" : "text-muted-foreground hover:text-amber-500 hover:bg-muted"}`}
          >
            <Star className={`size-3.5 ${project.isFavorite ? "fill-amber-500" : ""}`} />
          </button>
          <button
            onClick={toggleDiscard}
            disabled={isUpdating}
            title={project.isDiscarded ? "Restaurar proyecto" : "Descartar proyecto"}
            className={`p-1.5 rounded-lg transition-colors ${project.isDiscarded ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-destructive hover:bg-muted"}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
