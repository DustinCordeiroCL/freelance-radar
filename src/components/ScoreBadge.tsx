import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null;
}

export function ScoreBadge({ score }: ScoreBadgeProps): React.ReactElement {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        score >= 70 && "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
        score >= 40 && score < 70 && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
        score < 40 && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
      )}
    >
      {score}%
    </span>
  );
}
