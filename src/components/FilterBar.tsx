"use client";

import { LayoutGrid, List } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Filters } from "@/types/project";
import type { ViewMode } from "@/hooks/useViewMode";

const PLATFORMS = ["workana", "freelancer", "99freelas", "indeed", "soyfreelancer", "upwork"];
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

const DEFAULT_FILTERS: Filters = {
  platforms: [],
  minScore: 0,
  search: "",
  proposalStatuses: [],
  showDiscarded: false,
  sort: "date",
};

function isActive(filters: Filters): boolean {
  return (
    filters.platforms.length > 0 ||
    filters.minScore > 0 ||
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
}

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterBar({ filters, onChange, total, viewMode, onViewModeChange }: FilterBarProps): React.ReactElement {
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

      {/* Platform multi-select */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Platform</Label>
        <div className="flex gap-1 flex-wrap">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...filters, platforms: toggleItem(filters.platforms, p) })}
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                filters.platforms.includes(p)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Min score slider */}
      <div className="flex flex-col gap-1.5 min-w-36">
        <Label className="text-xs text-muted-foreground">
          Min score: <span className="font-semibold text-foreground">{filters.minScore}</span>
        </Label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minScore}
          onChange={(e) => onChange({ ...filters, minScore: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer
            bg-muted
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:size-3.5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary
            [&::-webkit-slider-thumb]:border
            [&::-webkit-slider-thumb]:border-border
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:size-3.5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
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
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                filters.proposalStatuses.includes(value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Show discarded */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange({ ...filters, showDiscarded: !filters.showDiscarded })}
          className={`px-2 py-1 rounded text-xs border transition-colors ${
            filters.showDiscarded
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : "bg-background text-muted-foreground border-border hover:border-primary"
          }`}
        >
          {filters.showDiscarded ? "Hiding discarded ✓" : "Show discarded"}
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
              className={`px-2 py-1 rounded text-xs border transition-colors ${
                filters.sort === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right side — count, view toggle, reset */}
      <div className="flex items-center gap-3 ml-auto">
        {total !== undefined && (
          <span className="text-xs text-muted-foreground">{total} project{total !== 1 ? "s" : ""}</span>
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
