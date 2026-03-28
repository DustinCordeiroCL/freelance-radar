"use client";

import { useState, useEffect, useRef } from "react";

const PAGE_SIZE = 30;
const THRESHOLD_PX = 300;

export function useInfiniteScroll<T>(
  items: T[],
  resetKey?: unknown,
  containerRef?: React.RefObject<HTMLElement | null>,
): {
  visible: T[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
} {
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const hasMore = count < items.length;

  // Reset when filters or total item count changes.
  const stableKey = JSON.stringify(resetKey) + ":" + String(items.length);
  useEffect(() => {
    setCount(PAGE_SIZE);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey]);

  // Scroll-based detection: more reliable than IntersectionObserver with a
  // non-viewport root (avoids root=null fallback when containerRef is not
  // yet populated at effect creation time).
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || !hasMore) return;

    function check() {
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      const sentinelBottom = sentinel.getBoundingClientRect().bottom;
      const containerBottom = container!.getBoundingClientRect().bottom;
      if (sentinelBottom - containerBottom <= THRESHOLD_PX) {
        setCount((c) => Math.min(c + PAGE_SIZE, items.length));
      }
    }

    container.addEventListener("scroll", check, { passive: true });
    // Check immediately — sentinel may already be visible on first render.
    check();
    return () => container.removeEventListener("scroll", check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, items.length, hasMore]);

  return {
    visible: items.slice(0, count),
    sentinelRef,
    hasMore,
  };
}
