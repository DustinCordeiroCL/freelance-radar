"use client";

import { useState, useEffect } from "react";

export type ViewMode = "grid" | "list";

const STORAGE_KEY = "freelance-radar-view-mode";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "list" || stored === "grid") setMode(stored);
  }, []);

  function setAndPersist(next: ViewMode): void {
    setMode(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return [mode, setAndPersist];
}
