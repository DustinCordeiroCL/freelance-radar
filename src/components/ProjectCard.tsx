"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, Trash2, ExternalLink, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ScoreBadge } from "./ScoreBadge";
import { PlatformBadge } from "./PlatformBadge";
import { StatusBadge } from "./StatusBadge";
import type { Project, ProposalStatus } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onUpdate: (updated: Partial<Project> & { id: string }) => void;
  onGenerateProposal: (project: Project) => void;
}

const STATUS_OPTIONS: Array<{ value: ProposalStatus | ""; label: string }> = [
  { value: "", label: "No status" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "em_desenvolvimento", label: "Em desenvolvimento" },
  { value: "concluida", label: "Concluída" },
];

export function ProjectCard({ project, onUpdate, onGenerateProposal }: ProjectCardProps): React.ReactElement {
  const [isUpdating, setIsUpdating] = useState(false);

  const tags: string[] = project.tags ? (JSON.parse(project.tags) as string[]) : [];

  const relativeTime = project.postedAt
    ? formatDistanceToNow(new Date(project.postedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(project.collectedAt), { addSuffix: true });

  async function toggleFavorite(): Promise<void> {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/favorite`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle favorite");
      const data = (await res.json()) as { isFavorite: boolean };
      onUpdate({ id: project.id, isFavorite: data.isFavorite });
      toast.success(data.isFavorite ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    } finally {
      setIsUpdating(false);
    }
  }

  async function toggleDiscard(): Promise<void> {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/discard`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to toggle discard");
      const data = (await res.json()) as { isDiscarded: boolean };
      onUpdate({ id: project.id, isDiscarded: data.isDiscarded });
      toast.success(data.isDiscarded ? "Project discarded" : "Project restored");
    } catch {
      toast.error("Failed to update project");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleStatusChange(value: string): Promise<void> {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalStatus: value || null }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = (await res.json()) as { proposalStatus: string | null };
      onUpdate({ id: project.id, proposalStatus: data.proposalStatus });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className={`rounded-lg border border-border bg-card p-4 flex flex-col gap-3 transition-shadow hover:shadow-md ${project.isDiscarded ? "opacity-50" : ""}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={project.platform} />
          <ScoreBadge score={project.matchScore} />
          <StatusBadge status={project.proposalStatus} />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{relativeTime}</span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-sm leading-snug line-clamp-2">{project.title}</h3>

      {/* Score reason */}
      {project.scoreReason && (
        <p className="text-xs text-muted-foreground italic line-clamp-1">{project.scoreReason}</p>
      )}

      {/* Budget */}
      {project.budget && (
        <p className="text-xs font-medium text-foreground/80">{project.budget}</p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 6).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground">
              {tag}
            </span>
          ))}
          {tags.length > 6 && (
            <span className="px-1.5 py-0.5 rounded text-xs text-muted-foreground">
              +{tags.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Status selector + actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
        <select
          value={project.proposalStatus ?? ""}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className="text-xs bg-background border border-border rounded px-2 py-1 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onGenerateProposal(project)}
            title={project.proposalText ? "View saved proposal" : "Generate proposal"}
            className={`p-1.5 rounded hover:bg-accent transition-colors relative ${project.proposalText ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            <FileText className="size-4" />
            {project.proposalText && (
              <CheckCircle2 className="size-2.5 absolute -top-0.5 -right-0.5 fill-primary text-primary-foreground" />
            )}
          </button>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on platform"
            className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-4" />
          </a>
          <button
            onClick={toggleFavorite}
            disabled={isUpdating}
            title={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
            className={`p-1.5 rounded hover:bg-accent transition-colors ${project.isFavorite ? "text-yellow-500" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Star className={`size-4 ${project.isFavorite ? "fill-yellow-500" : ""}`} />
          </button>
          <button
            onClick={toggleDiscard}
            disabled={isUpdating}
            title={project.isDiscarded ? "Restore project" : "Discard project"}
            className={`p-1.5 rounded hover:bg-accent transition-colors ${project.isDiscarded ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
