import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
}

const PLATFORM_STYLES: Record<string, string> = {
  workana:         "bg-blue-50    text-blue-700    border border-blue-200    dark:bg-blue-950/40    dark:text-blue-400    dark:border-blue-800/40",
  freelancer:      "bg-violet-50  text-violet-700  border border-violet-200  dark:bg-violet-950/40  dark:text-violet-400  dark:border-violet-800/40",
  "99freelas":     "bg-orange-50  text-orange-700  border border-orange-200  dark:bg-orange-950/40  dark:text-orange-400  dark:border-orange-800/40",
  indeed:          "bg-sky-50     text-sky-700     border border-sky-200     dark:bg-sky-950/40     dark:text-sky-400     dark:border-sky-800/40",
  soyfreelancer:   "bg-red-50     text-red-700     border border-red-200     dark:bg-red-950/40     dark:text-red-400     dark:border-red-800/40",
  upwork:          "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40",
  remoteok:        "bg-teal-50    text-teal-700    border border-teal-200    dark:bg-teal-950/40    dark:text-teal-400    dark:border-teal-800/40",
  weworkremotely:  "bg-indigo-50  text-indigo-700  border border-indigo-200  dark:bg-indigo-950/40  dark:text-indigo-400  dark:border-indigo-800/40",
  remotive:        "bg-pink-50    text-pink-700    border border-pink-200    dark:bg-pink-950/40    dark:text-pink-400    dark:border-pink-800/40",
  trampos:         "bg-yellow-50  text-yellow-700  border border-yellow-200  dark:bg-yellow-950/40  dark:text-yellow-400  dark:border-yellow-800/40",
  torre:           "bg-cyan-50    text-cyan-700    border border-cyan-200    dark:bg-cyan-950/40    dark:text-cyan-400    dark:border-cyan-800/40",
  getonboard:      "bg-lime-50    text-lime-700    border border-lime-200    dark:bg-lime-950/40    dark:text-lime-400    dark:border-lime-800/40",
  programathor:    "bg-purple-50  text-purple-700  border border-purple-200  dark:bg-purple-950/40  dark:text-purple-400  dark:border-purple-800/40",
  guru:            "bg-amber-50   text-amber-700   border border-amber-200   dark:bg-amber-950/40   dark:text-amber-400   dark:border-amber-800/40",
};

const PLATFORM_LABELS: Record<string, string> = {
  workana:        "Workana",
  freelancer:     "Freelancer",
  "99freelas":    "99Freelas",
  indeed:         "Indeed",
  soyfreelancer:  "SoyFreelancer",
  upwork:         "Upwork",
  remoteok:       "RemoteOK",
  weworkremotely: "WWRemotely",
  remotive:       "Remotive",
  trampos:        "Trampos",
  torre:          "Torre",
  getonboard:     "GetOnBoard",
  programathor:   "Programathor",
  guru:           "Guru",
};

export function PlatformBadge({ platform }: PlatformBadgeProps): React.ReactElement {
  const style = PLATFORM_STYLES[platform] ?? "bg-muted text-muted-foreground border border-border";
  const label = PLATFORM_LABELS[platform] ?? platform;

  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium", style)}>
      {label}
    </span>
  );
}
