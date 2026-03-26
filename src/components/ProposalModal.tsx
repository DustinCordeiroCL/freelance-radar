"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, RefreshCw, Save, ExternalLink, Loader2 } from "lucide-react";
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

    if (project.proposalText) {
      setProposalText(project.proposalText);
    } else {
      setProposalText("");
      void generateProposal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            {project && <PlatformBadge platform={project.platform} />}
            {project && <ScoreBadge score={project.matchScore} />}
          </div>
          <DialogTitle className="text-base font-semibold leading-snug mt-1">
            {project?.title}
          </DialogTitle>
        </DialogHeader>

        {/* Proposal textarea */}
        <div className="flex-1 min-h-0 relative">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Generating proposal...</p>
            </div>
          ) : (
            <textarea
              value={proposalText}
              onChange={(e) => setProposalText(e.target.value)}
              placeholder="Proposal will appear here..."
              className="w-full h-64 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
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

          {/* Right: actions */}
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
              disabled={!proposalText.trim() || isGenerating}
              className="gap-1.5"
            >
              <Copy className="size-3.5" />
              Copy
            </Button>
            <Button
              size="sm"
              onClick={() => void saveProposal()}
              disabled={!proposalText.trim() || isGenerating || isSaving}
              className="gap-1.5"
            >
              {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
