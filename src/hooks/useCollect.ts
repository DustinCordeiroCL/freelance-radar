"use client";

import { useState } from "react";
import { toast } from "sonner";

interface CollectResult {
  platform: string;
  collected: number;
  saved: number;
  error?: string;
}

interface CollectResponse {
  success: boolean;
  results: CollectResult[];
  totalSaved: number;
}

export function useCollect(onSuccess?: () => void): {
  isCollecting: boolean;
  trigger: () => Promise<void>;
  lastCollectedAt: Date | null;
} {
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastCollectedAt, setLastCollectedAt] = useState<Date | null>(null);

  async function trigger(): Promise<void> {
    if (isCollecting) return;
    setIsCollecting(true);

    const toastId = toast.loading("Collecting opportunities...");

    try {
      const res = await fetch("/api/collect", { method: "POST" });
      if (!res.ok) throw new Error("Collection failed");

      const data = (await res.json()) as CollectResponse;
      setLastCollectedAt(new Date());

      toast.success(
        `Collection complete — ${data.totalSaved} new project${data.totalSaved !== 1 ? "s" : ""} saved`,
        { id: toastId }
      );

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Collection failed: ${message}`, { id: toastId });
    } finally {
      setIsCollecting(false);
    }
  }

  return { isCollecting, trigger, lastCollectedAt };
}
