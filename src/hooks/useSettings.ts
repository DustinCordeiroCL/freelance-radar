"use client";

import { useState, useEffect } from "react";

interface SettingsState {
  activePlatforms: string[];
  loaded: boolean;
}

const PLATFORM_FLAGS: Array<{ flag: string; name: string }> = [
  { flag: "activeWorkana", name: "workana" },
  { flag: "activeFreelancer", name: "freelancer" },
  { flag: "active99Freelas", name: "99freelas" },
  { flag: "activeIndeed", name: "indeed" },
  { flag: "activeSoyFreelancer", name: "soyfreelancer" },
  { flag: "activeUpwork", name: "upwork" },
  { flag: "activeRemoteOK", name: "remoteok" },
  { flag: "activeWeWorkRemotely", name: "weworkremotely" },
  { flag: "activeRemotive", name: "remotive" },
  { flag: "activeTrampos", name: "trampos" },
  { flag: "activeTorre", name: "torre" },
  { flag: "activeGetOnBoard", name: "getonboard" },
  { flag: "activeProgramathor", name: "programathor" },
  { flag: "activeGuru", name: "guru" },
];

export function useSettings(): SettingsState {
  const [state, setState] = useState<SettingsState>({ activePlatforms: [], loaded: false });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: Record<string, unknown>) => {
        const active = PLATFORM_FLAGS
          .filter(({ flag }) => Boolean(s[flag]))
          .map(({ name }) => name);
        setState({ activePlatforms: active, loaded: true });
      })
      .catch(() => setState((prev) => ({ ...prev, loaded: true })));
  }, []);

  return state;
}
