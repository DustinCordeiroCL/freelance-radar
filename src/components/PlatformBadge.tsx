import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
}

const PLATFORM_STYLES: Record<string, string> = {
  workana: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  freelancer: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  "99freelas": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  indeed: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
};

const PLATFORM_LABELS: Record<string, string> = {
  workana: "Workana",
  freelancer: "Freelancer",
  "99freelas": "99Freelas",
  indeed: "Indeed",
};

export function PlatformBadge({ platform }: PlatformBadgeProps): React.ReactElement {
  const style = PLATFORM_STYLES[platform] ?? "bg-muted text-muted-foreground";
  const label = PLATFORM_LABELS[platform] ?? platform;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style
      )}
    >
      {label}
    </span>
  );
}
