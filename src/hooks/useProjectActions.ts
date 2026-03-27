"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Project } from "@/types/project";

interface ProjectActions {
  isUpdating: boolean;
  toggleFavorite: () => Promise<void>;
  toggleDiscard: () => Promise<void>;
  handleStatusChange: (value: string) => Promise<void>;
  handleValueSave: (valueInput: string, currentStatus: string | null) => Promise<void>;
}

export function useProjectActions(
  project: Project,
  onUpdate: (updated: Partial<Project> & { id: string }) => void
): ProjectActions {
  const [isUpdating, setIsUpdating] = useState(false);

  async function toggleFavorite(): Promise<void> {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/favorite`, { method: "PATCH" });
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
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
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { proposalStatus: string | null };
      onUpdate({ id: project.id, proposalStatus: data.proposalStatus });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleValueSave(valueInput: string, currentStatus: string | null): Promise<void> {
    const parsed = parseFloat(valueInput);
    if (isNaN(parsed) && valueInput !== "") return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalStatus: currentStatus,
          proposalValue: valueInput === "" ? null : parsed,
        }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { proposalValue: number | null };
      onUpdate({ id: project.id, proposalValue: data.proposalValue });
      toast.success("Value saved");
    } catch {
      toast.error("Failed to save value");
    } finally {
      setIsUpdating(false);
    }
  }

  return { isUpdating, toggleFavorite, toggleDiscard, handleStatusChange, handleValueSave };
}
