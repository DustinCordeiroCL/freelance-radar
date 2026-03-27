"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, RefreshCw, Save, ExternalLink, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "./PlatformBadge";
import { ScoreBadge } from "./ScoreBadge";
import type { Project } from "@/types/project";

interface ProposalModalProps {
  project: Project | null;
  onClose: () => void;
  onProposalSaved: (projectId: string, proposalText: string) => void;
}

export function ProposalModal({ project, onClose, onProposalSaved }: ProposalModalProps): React.ReactElement {
  const [proposalText, setProposalText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!project) return;
    setProposalText(project.proposalText ?? "");
  }, [project?.id]);

  async function generateProposal(): Promise<void> {
    if (!project) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Generation failed");
      }

      const data = (await res.json()) as { proposalText: string };
      setProposalText(data.proposalText);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to generate proposal: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveProposal(): Promise<void> {
    if (!project || !proposalText.trim()) return;
    setIsSaving(true);

    try {
      const res = await fetch(`/api/projects/${project.id}/proposal`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalText }),
      });

      if (!res.ok) throw new Error("Save failed");

      onProposalSaved(project.id, proposalText);
      toast.success("Proposal saved");
    } catch {
      toast.error("Failed to save proposal");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyProposal(): Promise<void> {
    if (!proposalText.trim()) return;
    await navigator.clipboard.writeText(proposalText);
    toast.success("Copied to clipboard");
  }

  return (
    <Dialog open={!!project} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] h-[85vh] flex flex-col gap-3">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            {project && <PlatformBadge platform={project.platform} />}
            {project && <ScoreBadge score={project.matchScore} />}
          </div>
          <DialogTitle className="text-base font-semibold leading-snug mt-1">
            {project?.title}
          </DialogTitle>
        </DialogHeader>

        {/* Project description */}
        {project?.description && (
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2.5 max-h-48 overflow-y-auto leading-relaxed border border-border">
            {project.description}
          </div>
        )}

        {/* Proposal area */}
        <div className="flex-1 min-h-0">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground border border-dashed border-border rounded-md">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Generating proposal...</p>
            </div>
          ) : proposalText ? (
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              placeholder="Proposal will appear here..."
              className="w-full h-full min-h-48 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3 border border-dashed border-border rounded-md text-muted-foreground">
              <p className="text-xs">No proposal generated yet</p>
              <Button onClick={() => void generateProposal()} className="gap-2" size="sm">
                <Sparkles className="size-4" />
                Generate Proposal
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          {/* Left: open on platform */}
          <a
            href={project?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
            Open on platform
          </a>

          {/* Right: actions (only when proposal exists) */}
          {proposalText && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void generateProposal()}
                disabled={isGenerating || isSaving}
                className="gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void copyProposal()}
                disabled={isGenerating}
                className="gap-1.5"
              >
                <Copy className="size-3.5" />
                Copy
              </Button>
              <Button
                size="sm"
                onClick={() => void saveProposal()}
                disabled={isGenerating || isSaving}
                className="gap-1.5"
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
