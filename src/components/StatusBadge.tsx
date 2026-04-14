import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  em_negociacao: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  em_desenvolvimento: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  concluida: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const STATUS_LABELS: Record<string, string> = {
  em_negociacao: "En negociación",
  em_desenvolvimento: "En desarrollo",
  concluida: "Concluido",
};

export function StatusBadge({ status }: StatusBadgeProps): React.ReactElement | null {
  if (!status) return null;

  const style = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground";
  const label = STATUS_LABELS[status] ?? status;

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", style)}>
      {label}
    </span>
  );
}
