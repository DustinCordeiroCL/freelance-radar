"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Project, Filters } from "@/types/project";

export const DEFAULT_FILTERS: Filters = {
  platforms: [],
  hideUnscored: false,
  search: "",
  proposalStatuses: [],
  showDiscarded: false,
  sort: "date",
};

function parseBudgetValue(budget: string | null): number {
  if (!budget) return -1;
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
  return copy.sort(
    (a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
  );
}

/** Read initial filter state from the current URL search params */
export function filtersFromUrl(): Filters {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  const p = new URLSearchParams(window.location.search);
  return {
    platforms: p.get("platforms") ? p.get("platforms")!.split(",") : [],
    hideUnscored: p.get("hideUnscored") === "1",
    search: p.get("search") ?? "",
    proposalStatuses: p.get("statuses") ? p.get("statuses")!.split(",") : [],
    showDiscarded: p.get("showDiscarded") === "1",
    sort: (p.get("sort") as Filters["sort"]) ?? "date",
  };
}

/** Sync filter state to URL without triggering navigation */
function pushFiltersToUrl(filters: Filters): void {
  const p = new URLSearchParams();
  if (filters.platforms.length) p.set("platforms", filters.platforms.join(","));
  if (filters.hideUnscored) p.set("hideUnscored", "1");
  if (filters.search) p.set("search", filters.search);
  if (filters.proposalStatuses.length) p.set("statuses", filters.proposalStatuses.join(","));
  if (filters.showDiscarded) p.set("showDiscarded", "1");
  if (filters.sort !== "date") p.set("sort", filters.sort);
  const qs = p.toString();
  const next = qs ? `?${qs}` : window.location.pathname;
  window.history.replaceState(null, "", next);
}

export function useProjects(onlyFavorites = false, syncUrl = false): {
  projects: Project[];
  filters: Filters;
  isLoading: boolean;
  setFilters: (f: Filters) => void;
  updateProject: (updated: Partial<Project> & { id: string }) => void;
  reload: () => void;
} {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filters, setFiltersState] = useState<Filters>(
    syncUrl ? filtersFromUrl() : DEFAULT_FILTERS
  );
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const projectsRef = useRef<Project[]>([]);
  const fetchRef = useRef<(silent: boolean) => Promise<Project[] | null>>(async () => null);

  function setFilters(f: Filters): void {
    setFiltersState(f);
    if (syncUrl) pushFiltersToUrl(f);
  }

  function stopPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }

  function startPolling() {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      const hasUnscored = projectsRef.current.some((p) => p.matchScore === null);
      if (!hasUnscored) {
        stopPolling();
        return;
      }
      void fetchRef.current(true);
    }, 5000);
  }

  const fetchProjects = useCallback(async (silent = false): Promise<Project[] | null> => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (onlyFavorites) params.set("isFavorite", "true");
      if (filters.showDiscarded) params.set("isDiscarded", "true");

      const res = await fetch(`/api/projects?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch projects");

      let data = (await res.json()) as Project[];

      // Client-side filters (applied after fetch)
      if (filters.platforms.length > 0) {
        data = data.filter((p) => filters.platforms.includes(p.platform));
      }
      if (filters.proposalStatuses.length > 0) {
        data = data.filter((p) => {
          const key = p.proposalStatus ?? "none";
          return filters.proposalStatuses.includes(key);
        });
      }
      if (filters.hideUnscored) {
        data = data.filter((p) => p.matchScore !== null);
      }

      const sorted = sortProjects(data, filters.sort);
      setProjects(sorted);
      projectsRef.current = sorted;

      // Auto-manage polling
      const hasUnscored = sorted.some((p) => p.matchScore === null);
      if (hasUnscored) startPolling();
      else stopPolling();

      return sorted;
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      return null;
    } finally {
      if (!silent) setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, onlyFavorites]);

  useEffect(() => {
    fetchRef.current = fetchProjects;
  }, [fetchProjects]);

  useEffect(() => {
    void fetchProjects(false);
  }, [fetchProjects]);

  useEffect(() => {
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateProject(updated: Partial<Project> & { id: string }): void {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );
  }

  return { projects, filters, isLoading, setFilters, updateProject, reload: fetchProjects };
}
