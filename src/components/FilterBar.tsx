"use client";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { Filters } from "@/types/project";

const PLATFORMS = ["workana", "freelancer", "99freelas", "indeed"];
const PLATFORM_LABELS: Record<string, string> = {
  workana: "Workana",
  freelancer: "Freelancer",
  "99freelas": "99Freelas",
  indeed: "Indeed",
};
const PROPOSAL_STATUSES = [
  { value: "none", label: "Sem proposta" },
  { value: "em_negociacao", label: "Em negociação" },
  { value: "em_desenvolvimento", label: "Em desenvolvimento" },
  { value: "concluida", label: "Concluída" },
];

const DEFAULT_FILTERS: Filters = {
  platforms: [],
  minScore: 0,
  search: "",
  proposalStatuses: [],
  showDiscarded: false,
};

function isActive(filters: Filters): boolean {
  return (
    filters.platforms.length > 0 ||
    filters.minScore > 0 ||
    filters.search !== "" ||
    filters.proposalStatuses.length > 0 ||
    filters.showDiscarded
  );
}

interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  total?: number;
}

function toggleItem(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterBar({ filters, onChange, total }: FilterBarProps): React.ReactElement {
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
        <div className="flex gap-1">
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
      <div className="flex flex-col gap-1 min-w-36">
        <Label className="text-xs text-muted-foreground">
          Min score: <span className="font-semibold text-foreground">{filters.minScore}</span>
        </Label>
        <Slider
          min={0}
          max={100}
          step={5}
          value={[filters.minScore]}
          onValueChange={(val) => onChange({ ...filters, minScore: (val as number[])[0] ?? 0 })}
          className="w-full"
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

      {/* Show discarded toggle */}
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

      {/* Reset + count */}
      <div className="flex items-center gap-3 ml-auto">
        {total !== undefined && (
          <span className="text-xs text-muted-foreground">{total} project{total !== 1 ? "s" : ""}</span>
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
