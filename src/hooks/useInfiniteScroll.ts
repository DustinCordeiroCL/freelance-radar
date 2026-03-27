"use client";

import { useState, useEffect, useRef } from "react";

const PAGE_SIZE = 30;

export function useInfiniteScroll<T>(items: T[], resetKey?: unknown): {
  visible: T[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
} {
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = count < items.length;

  // Reset only when filters change or the total number of items changes.
  // Score/data updates on existing items don't change resetKey or items.length,
  // so they won't collapse the scroll position.
  const stableKey = JSON.stringify(resetKey) + ":" + String(items.length);
  useEffect(() => {
    setCount(PAGE_SIZE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  // Reconnect the observer on every count change.
  // This ensures that if the sentinel is still inside the intersection zone after
  // a load (e.g. items are short / screen is tall), IntersectionObserver.observe()
  // re-fires immediately with isIntersecting: true and loads the next batch.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, items.length, hasMore]);

  return {
    visible: items.slice(0, count),
    sentinelRef,
    hasMore,
  };
}
