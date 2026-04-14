"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutGrid, List } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DEFAULT_FILTERS } from "@/hooks/useProjects";
import type { Filters } from "@/types/project";
import type { ViewMode } from "@/hooks/useViewMode";

const ALL_PLATFORMS = [
  "workana", "freelancer", "99freelas", "indeed",
  "soyfreelancer", "upwork", "remoteok", "weworkremotely",
  "remotive", "trampos", "torre", "getonboard", "programathor", "guru",
];
const PLATFORM_LABELS: Record<string, string> = {
  workana: "Workana",
  freelancer: "Freelancer",
  "99freelas": "99Freelas",
  indeed: "Indeed",
  soyfreelancer: "SoyFreelancer",
  upwork: "Upwork",
  remoteok: "RemoteOK",
  weworkremotely: "WeWorkRemotely",
  remotive: "Remotive",
  trampos: "Trampos",
  torre: "Torre.co",
  getonboard: "GetOnBoard",
  programathor: "Programathor",
  guru: "Guru.com",
};
const PROPOSAL_STATUSES = [
  { value: "none", label: "Sin propuesta" },
  { value: "em_negociacao", label: "En negociación" },
  { value: "em_desenvolvimento", label: "En desarrollo" },
  { value: "concluida", label: "Concluido" },
];
const SORT_OPTIONS = [
  { value: "date", label: "Fecha" },
  { value: "score", label: "Score" },
  { value: "value", label: "Valor" },
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

interface MultiSelectDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(value: string): void {
    onChange(
      selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
    );
  }

  const summary =
    selected.length === 0
      ? label
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} (${selected.length})`;

  const isFiltered = selected.length > 0;

  return (
    <div ref={ref} className="relative flex flex-col gap-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-8 px-2.5 rounded text-xs border transition-colors whitespace-nowrap ${
          isFiltered
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:border-primary"
        }`}
      >
        {summary}
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 min-w-44 bg-card border border-border rounded shadow-lg py-1">
          {options.map(({ value, label: optLabel }) => (
            <label
              key={value}
              className="flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-accent transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(value)}
                onChange={() => toggle(value)}
                className="size-3 accent-primary"
              />
              {optLabel}
            </label>
          ))}
        </div>
      )}
    </div>
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
    return "h-8 px-2.5 rounded text-xs border transition-colors bg-destructive/10 text-destructive border-destructive/30";
  }
  if (active) {
    return "h-8 px-2.5 rounded text-xs border transition-colors bg-primary text-primary-foreground border-primary";
  }
  return "h-8 px-2.5 rounded text-xs border transition-colors bg-background text-muted-foreground border-border hover:border-primary";
}

export function FilterBar({
  filters,
  onChange,
  total,
  viewMode,
  onViewModeChange,
  activePlatforms,
}: FilterBarProps): React.ReactElement {
  const visiblePlatforms =
    activePlatforms && activePlatforms.length > 0
      ? ALL_PLATFORMS.filter((p) => activePlatforms.includes(p))
      : ALL_PLATFORMS;

  const platformOptions = visiblePlatforms.map((p) => ({
    value: p,
    label: PLATFORM_LABELS[p] ?? p,
  }));

  return (
    <div className="flex flex-wrap gap-3 items-end p-4 border-b border-border bg-card">
      {/* Search */}
      <div className="flex flex-col gap-1 min-w-48">
        <Label className="text-xs text-muted-foreground">Buscar</Label>
        <Input
          placeholder="Título, etiquetas, descripción..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Platform multiselect dropdown */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Plataforma</Label>
        <MultiSelectDropdown
          label="Plataforma"
          options={platformOptions}
          selected={filters.platforms}
          onChange={(platforms) => onChange({ ...filters, platforms })}
        />
      </div>

      {/* Proposal status multiselect dropdown */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Estado de propuesta</Label>
        <MultiSelectDropdown
          label="Estado"
          options={PROPOSAL_STATUSES}
          selected={filters.proposalStatuses}
          onChange={(proposalStatuses) => onChange({ ...filters, proposalStatuses })}
        />
      </div>

      {/* Toggles */}
      <div className="flex items-end gap-2">
        <button
          onClick={() => onChange({ ...filters, hideUnscored: !filters.hideUnscored })}
          className={btnClass(filters.hideUnscored)}
        >
          {filters.hideUnscored ? "Sin score ocultos ✓" : "Ocultar sin score"}
        </button>
        <button
          onClick={() => onChange({ ...filters, showDiscarded: !filters.showDiscarded })}
          className={btnClass(filters.showDiscarded, "destructive")}
        >
          {filters.showDiscarded ? "Mostrando descartados ✓" : "Ver descartados"}
        </button>
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs text-muted-foreground">Ordenar por</Label>
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

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {total !== undefined && (
          <span className="text-xs text-muted-foreground">
            {total} proyecto{total !== 1 ? "s" : ""}
          </span>
        )}

        {onViewModeChange && viewMode && (
          <div className="flex items-center gap-0.5 border border-border rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              title="Vista cuadrícula"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
              title="Vista lista"
            >
              <List className="size-3.5" />
            </button>
          </div>
        )}

        {isActive(filters) && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="h-8 px-2.5 rounded text-xs border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
