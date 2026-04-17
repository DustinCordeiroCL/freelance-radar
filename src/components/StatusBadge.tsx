import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  em_negociacao:    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40",
  em_desenvolvimento: "bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/40",
  concluida:        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
};

const STATUS_LABELS: Record<string, string> = {
  em_negociacao:    "Negociación",
  em_desenvolvimento: "Desarrollo",
  concluida:        "Concluido",
};

const STATUS_DOTS: Record<string, string> = {
  em_negociacao:    "bg-amber-500",
  em_desenvolvimento: "bg-violet-500",
  concluida:        "bg-emerald-500",
};

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement | null {
  if (!status) return null;

  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border border-border";
  const label = STATUS_LABELS[status] ?? status;
  const dot = STATUS_DOTS[status] ?? "bg-muted-foreground";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium", style)}>
      <span className={cn("size-1.5 rounded-full shrink-0", dot)} />
      {label}
    </span>
  );
}
