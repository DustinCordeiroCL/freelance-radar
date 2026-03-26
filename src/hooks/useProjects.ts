"use client";

import { useState, useEffect, useCallback } from "react";
import type { Project, Filters } from "@/types/project";

const DEFAULT_FILTERS: Filters = {
  platforms: [],
  minScore: 0,
  search: "",
  proposalStatuses: [],
  showDiscarded: false,
};

export function useProjects(onlyFavorites = false): {
  projects: Project[];
  filters: Filters;
  isLoading: boolean;
  setFilters: (f: Filters) => void;
  updateProject: (updated: Partial<Project> & { id: string }) => void;
  reload: () => void;
} {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.platforms.length === 1) params.set("platform", filters.platforms[0]!);
      if (filters.minScore > 0) params.set("minScore", String(filters.minScore));
      if (filters.search) params.set("search", filters.search);
      if (onlyFavorites) params.set("isFavorite", "true");
      if (filters.showDiscarded) params.set("isDiscarded", "true");

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");

      let data = (await res.json()) as Project[];

      // Client-side: multi-platform filter
      if (filters.platforms.length > 1) {
        data = data.filter((p) => filters.platforms.includes(p.platform));
      }

      // Client-side: proposal status filter
      if (filters.proposalStatuses.length > 0) {
        data = data.filter((p) => {
          const key = p.proposalStatus ?? "none";
          return filters.proposalStatuses.includes(key);
        });
      }

      setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, onlyFavorites]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  function updateProject(updated: Partial<Project> & { id: string }): void {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  return { projects, filters, isLoading, setFilters, updateProject, reload: fetchProjects };
}
