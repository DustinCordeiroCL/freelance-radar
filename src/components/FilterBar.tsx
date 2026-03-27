"use client";

import { LayoutGrid, List } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DEFAULT_FILTERS } from "@/hooks/useProjects";
import type { Filters } from "@/types/project";
import type { ViewMode } from "@/hooks/useViewMode";

const ALL_PLATFORMS = ["workana", "freelancer", "99freelas", "indeed", "soyfreelancer", "upwork"];
const PLATFORM_LABELS: Record<string, string> = {
  workana: "Workana",
  freelancer: "Freelancer",
  "99freelas": "99Freelas",
  indeed: "Indeed",
  soyfreelancer: "SoyFreelancer",
  upwork: "Upwork",
};
const PROPOSAL_STATUSES = [
  { value: "none", label: "Sem proposta" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "em_desenvolvimento", label: "Em desenvolvimento" },
  { value: "concluida", label: "Concluída" },
];
const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "score", label: "Score" },
  { value: "value", label: "Value" },
];

function isActive(filters: Filters): boolean {
  return (
    filters.platforms.length > 0 ||
    filters.hideUnscored ||
    filters.search !== "" ||
    filters.proposalStatuses.length > 0 ||
    filters.showDiscarded ||
    filters.sort !== "date"
  );
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  total?: number;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  /** Only platforms with active connectors are shown */
  activePlatforms?: string[];
}

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function btnClass(active: boolean, variant?: "destructive"): string {
  if (active && variant === "destructive") {
    return "px-2 py-1 rounded text-xs border transition-colors bg-destructive/10 text-destructive border-destructive/30";
  }
  if (active) {
    return "px-2 py-1 rounded text-xs border transition-colors bg-primary text-primary-foreground border-primary";
  }
  return "px-2 py-1 rounded text-xs border transition-colors bg-background text-muted-foreground border-border hover:border-primary";
}

export function FilterBar({
  filters,
  onChange,
  total,
  viewMode,
  onViewModeChange,
  activePlatforms,
}: FilterBarProps): React.ReactElement {
  // Show only platforms that have an active connector; fall back to all if not loaded yet
  const visiblePlatforms =
    activePlatforms && activePlatforms.length > 0
      ? ALL_PLATFORMS.filter((p) => activePlatforms.includes(p))
      : ALL_PLATFORMS;

  return (
    <div className="flex flex-wrap gap-4 items-end p-4 border-b border-border bg-card">
      {/* Search */}
      <div className="flex flex-col gap-1 min-w-48">
        <Label className="text-xs text-muted-foreground">Search</Label>
        <Input
          placeholder="Title, tags, description..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Platform multi-select — only active connectors */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Platform</Label>
        <div className="flex gap-1 flex-wrap">
          {visiblePlatforms.map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...filters, platforms: toggleItem(filters.platforms, p) })}
              className={btnClass(filters.platforms.includes(p))}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Proposal status multi-select */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Proposal status</Label>
        <div className="flex gap-1 flex-wrap">
          {PROPOSAL_STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                onChange({ ...filters, proposalStatuses: toggleItem(filters.proposalStatuses, value) })
              }
              className={btnClass(filters.proposalStatuses.includes(value))}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange({ ...filters, hideUnscored: !filters.hideUnscored })}
          className={btnClass(filters.hideUnscored)}
        >
          {filters.hideUnscored ? "Hide unscored ✓" : "Hide unscored"}
        </button>
        <button
          onClick={() => onChange({ ...filters, showDiscarded: !filters.showDiscarded })}
          className={btnClass(filters.showDiscarded, "destructive")}
        >
          {filters.showDiscarded ? "Showing discarded ✓" : "Show discarded"}
        </button>
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Sort by</Label>
        <div className="flex gap-1">
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, sort: value as Filters["sort"] })}
              className={btnClass(filters.sort === value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right side — count, view toggle, reset */}
      <div className="flex items-center gap-3 ml-auto">
        {total !== undefined && (
          <span className="text-xs text-muted-foreground">
            {total} project{total !== 1 ? "s" : ""}
          </span>
        )}

        {onViewModeChange && viewMode && (
          <div className="flex items-center gap-0.5 border border-border rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              title="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              title="List view"
            >
              <List className="size-3.5" />
            </button>
          </div>
        )}

        {isActive(filters) && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="px-2 py-1 rounded text-xs border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
}
