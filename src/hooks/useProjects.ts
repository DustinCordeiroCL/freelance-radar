"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Project, Filters } from "@/types/project";

const DEFAULT_FILTERS: Filters = {
  platforms: [],
  minScore: 0,
  search: "",
  proposalStatuses: [],
  showDiscarded: false,
  sort: "date",
};

function parseBudgetValue(budget: string | null): number {
  if (!budget) return -1;
  // Remove thousand separators (dots and commas used as separators), then extract numbers
  const normalized = budget.replace(/[.,]/g, "");
  const numbers = normalized.match(/\d+/g);
  if (!numbers) return -1;
  return Math.max(...numbers.map(Number));
}

function sortProjects(projects: Project[], sort: Filters["sort"]): Project[] {
  const copy = [...projects];
  if (sort === "score") {
    return copy.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
  }
  if (sort === "value") {
    return copy.sort((a, b) => {
      const aVal = a.proposalValue ?? parseBudgetValue(a.budget);
      const bVal = b.proposalValue ?? parseBudgetValue(b.budget);
      return bVal - aVal;
    });
  }
  // date: newest first (default API order)
  return copy.sort(
    (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
  );
}

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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectsRef = useRef<Project[]>([]);

  const fetchProjects = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
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

      if (filters.platforms.length > 1) {
        data = data.filter((p) => filters.platforms.includes(p.platform));
      }

      if (filters.proposalStatuses.length > 0) {
        data = data.filter((p) => {
          const key = p.proposalStatus ?? "none";
          return filters.proposalStatuses.includes(key);
        });
      }

      const sorted = sortProjects(data, filters.sort);
      setProjects(sorted);
      projectsRef.current = sorted;
      return data;
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      return null;
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [filters, onlyFavorites]);

  // Initial fetch
  useEffect(() => {
    void fetchProjects(false);
  }, [fetchProjects]);

  // Poll silently every 5s while any project has matchScore === null.
  // Uses a ref so the interval doesn't restart on every render.
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      const hasUnscored = projectsRef.current.some((p) => p.matchScore === null);
      if (hasUnscored) {
        void fetchProjects(true);
      }
    }, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchProjects]);

  function updateProject(updated: Partial<Project> & { id: string }): void {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  return { projects, filters, isLoading, setFilters, updateProject, reload: fetchProjects };
}
