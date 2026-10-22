"use client";

import { useEffect } from "react";
import { lockScroll } from "@/lib/scrollLock";

/** Lock page scroll while `active` is true. Nested-safe via ref-count. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    return lockScroll();
  }, [active]);
}
