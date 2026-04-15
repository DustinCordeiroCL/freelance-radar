"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, RefreshCw, Save, ExternalLink, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlatformBadge } from "./PlatformBadge";
import { ScoreBadge } from "./ScoreBadge";
import type { Project } from "@/types/project";
import { getStoredKey } from "@/lib/clientKey";

interface ProposalModalProps {
  project: Project | null;
  onClose: () => void;
  onProposalSaved: (projectId: string, proposalText: string) => void;
}

export function ProposalModal({ project, onClose, onProposalSaved }: ProposalModalProps): React.ReactElement {
  const [proposalText, setProposalText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasApiKey = !!getStoredKey();

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
        headers: {
          "Content-Type": "application/json",
          "x-anthropic-key": getStoredKey(),
        },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Generation failed");
      }
      const data = (await res.json()) as { proposalText: string };
      setProposalText(data.proposalText);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al generar la propuesta");
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
      toast.success("Propuesta guardada");
    } catch {
      toast.error("Error al guardar la propuesta");
    } finally {
      setIsSaving(false);
    }
  }

  async function copyProposal(): Promise<void> {
    if (!proposalText.trim()) return;
    await navigator.clipboard.writeText(proposalText);
    toast.success("Copiado al portapapeles");
  }

  return (
    <Dialog open={!!project} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* Override sm:max-w-sm from DialogContent with !important variants */}
      <DialogContent className="!max-w-[92vw] w-[92vw] max-h-[90vh] h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {project && <PlatformBadge platform={project.platform} />}
            {project && <ScoreBadge score={project.matchScore} />}
          </div>
          <DialogTitle className="text-base font-semibold leading-snug mt-1 pr-6">
            {project?.title}
          </DialogTitle>
        </DialogHeader>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0 divide-x divide-border">

          {/* Left: project description */}
          <div className="flex flex-col w-1/2 min-h-0">
            <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2 shrink-0">Descripción del proyecto</p>
            <div className="flex-1 overflow-y-auto px-4 pb-4 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {project?.description ?? "—"}
            </div>
          </div>

          {/* Right: proposal */}
          <div className="flex flex-col w-1/2 min-h-0">
            <p className="text-xs font-medium text-muted-foreground px-4 pt-3 pb-2 shrink-0">Propuesta</p>
            <div className="flex-1 min-h-0 px-4 pb-4">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground border border-dashed border-border rounded-md">
                  <Loader2 className="size-6 animate-spin" />
                  <p className="text-sm">Generando propuesta...</p>
                </div>
              ) : !hasApiKey ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 border border-dashed border-border rounded-md text-muted-foreground">
                  <p className="text-xs text-center px-4">
                    Configura una clave de API en{" "}
                    <Link href="/settings" className="underline hover:text-foreground transition-colors" onClick={onClose}>
                      Configuración
                    </Link>{" "}
                    para generar propuestas con IA.
                  </p>
                </div>
              ) : proposalText ? (
                <textarea
                  value={proposalText}
                  onChange={(e) => setProposalText(e.target.value)}
                  className="w-full h-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 border border-dashed border-border rounded-md text-muted-foreground">
                  <p className="text-xs">Aún no se ha generado una propuesta</p>
                  <Button onClick={() => void generateProposal()} size="sm" className="gap-2">
                    <Sparkles className="size-4" />
                    Generar propuesta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-border shrink-0">
          <a
            href={project?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" />
            Abrir en la plataforma
          </a>

          {proposalText && (
            <div className="flex items-center gap-2">
              {hasApiKey && (
                <Button variant="outline" size="sm" onClick={() => void generateProposal()} disabled={isGenerating || isSaving} className="gap-1.5">
                  <RefreshCw className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => void copyProposal()} disabled={isGenerating} className="gap-1.5">
                <Copy className="size-3.5" />
                Copiar
              </Button>
              {hasApiKey && (
                <Button size="sm" onClick={() => void saveProposal()} disabled={isGenerating || isSaving} className="gap-1.5">
                  {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Guardar
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
