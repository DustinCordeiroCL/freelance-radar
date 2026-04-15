"use client";

import { useState } from "react";
import { toast } from "sonner";
import { getStoredKey } from "@/lib/clientKey";

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

    const toastId = toast.loading("Recopilando oportunidades...");

    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "x-anthropic-key": getStoredKey() },
      });
      if (!res.ok) throw new Error("Collection failed");

      const data = (await res.json()) as CollectResponse;
      setLastCollectedAt(new Date());

      toast.success(
        `Recopilación completa — ${data.totalSaved} proyecto${data.totalSaved !== 1 ? "s" : ""} nuevo${data.totalSaved !== 1 ? "s" : ""}`,
        { id: toastId }
      );

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Error al recopilar: ${message}`, { id: toastId });
    } finally {
      setIsCollecting(false);
    }
  }

  return { isCollecting, trigger, lastCollectedAt };
}
