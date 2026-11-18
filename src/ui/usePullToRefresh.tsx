import { useEffect, useRef, useState } from "react";

const PULL = 70; // pixels to pull down before letting go refreshes

/**
 * Pull down from the top of the scroll to refresh. Attach the returned ref to an element
 * inside the scrolling box. Returns how far it's pulled (for the indicator) and whether it's refreshing.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>) {
  const ref = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    const box = ref.current?.closest(".scroll-body") as HTMLElement | null;
    if (!box) return;
    let startY: number | null = null;
    let dist = 0;
    const down = (e: TouchEvent) => { startY = box.scrollTop <= 0 ? e.touches[0].clientY : null; dist = 0; };
    const move = (e: TouchEvent) => {
      if (startY === null) return;
      dist = Math.max(0, e.touches[0].clientY - startY);
      setPull(Math.min(dist * 0.5, PULL * 1.3));
    };
    const up = async () => {
      if (startY !== null && dist * 0.5 >= PULL) {
        setRefreshing(true);
        try { await cb.current(); } finally { setRefreshing(false); }
      }
      startY = null; dist = 0; setPull(0);
    };
    box.addEventListener("touchstart", down, { passive: true });
    box.addEventListener("touchmove", move, { passive: true });
    box.addEventListener("touchend", up);
    return () => { box.removeEventListener("touchstart", down); box.removeEventListener("touchmove", move); box.removeEventListener("touchend", up); };
  }, []);

  return { ref, pull, refreshing, ready: pull >= PULL };
}

/** The little "pull to refresh" strip shown above the content. */
export function PullIndicator({ pull, refreshing, ready }: { pull: number; refreshing: boolean; ready: boolean }) {
  if (!refreshing && pull === 0) return null;
  return (
    <div className="pull" style={{ height: refreshing ? 34 : pull }}>
      {refreshing ? "↻ REFRESHING…" : ready ? "↑ LET GO TO REFRESH" : "↓ PULL TO REFRESH"}
    </div>
  );
}
