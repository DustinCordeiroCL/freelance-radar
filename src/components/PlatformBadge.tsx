import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: string;
}

const PLATFORM_STYLES: Record<string, string> = {
  workana:         "bg-blue-100    text-blue-800    dark:bg-blue-900/40    dark:text-blue-300",
  freelancer:      "bg-purple-100  text-purple-800  dark:bg-purple-900/40  dark:text-purple-300",
  "99freelas":     "bg-orange-100  text-orange-800  dark:bg-orange-900/40  dark:text-orange-300",
  indeed:          "bg-sky-100     text-sky-800     dark:bg-sky-900/40     dark:text-sky-300",
  soyfreelancer:   "bg-red-100     text-red-800     dark:bg-red-900/40     dark:text-red-300",
  upwork:          "bg-green-100   text-green-800   dark:bg-green-900/40   dark:text-green-300",
  remoteok:        "bg-teal-100    text-teal-800    dark:bg-teal-900/40    dark:text-teal-300",
  weworkremotely:  "bg-indigo-100  text-indigo-800  dark:bg-indigo-900/40  dark:text-indigo-300",
  remotive:        "bg-pink-100    text-pink-800    dark:bg-pink-900/40    dark:text-pink-300",
  trampos:         "bg-yellow-100  text-yellow-800  dark:bg-yellow-900/40  dark:text-yellow-300",
  torre:           "bg-cyan-100    text-cyan-800    dark:bg-cyan-900/40    dark:text-cyan-300",
  getonboard:      "bg-lime-100    text-lime-800    dark:bg-lime-900/40    dark:text-lime-300",
  programathor:    "bg-violet-100  text-violet-800  dark:bg-violet-900/40  dark:text-violet-300",
  guru:            "bg-amber-100   text-amber-800   dark:bg-amber-900/40   dark:text-amber-300",
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
