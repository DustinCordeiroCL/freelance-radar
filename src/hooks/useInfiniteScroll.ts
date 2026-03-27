"use client";

import { useState, useEffect, useRef } from "react";

const PAGE_SIZE = 30;

export function useInfiniteScroll<T>(items: T[]): {
  visible: T[];
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
} {
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset to first page when the source list changes (filter/sort)
  useEffect(() => {
    setCount(PAGE_SIZE);
  }, [items]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: "300px" } // start loading before the sentinel is visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  return {
    visible: items.slice(0, count),
    sentinelRef,
    hasMore: count < items.length,
  };
}
