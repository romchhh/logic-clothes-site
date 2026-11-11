"use client";

import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";

export type AnchoredMenuBox = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type Options = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  /** Preferred menu width in px */
  width?: number;
  /** Match anchor width (search inputs) */
  matchWidth?: boolean;
  minHeight?: number;
  maxHeight?: number;
  gap?: number;
  /** Prefer aligning menu's right edge to anchor's right */
  align?: "left" | "right" | "stretch";
};

/** Fixed position for a portaled menu, clamped inside the viewport. */
export function useAnchoredMenu({
  open,
  anchorRef,
  width = 208,
  matchWidth = false,
  minHeight = 120,
  maxHeight = 320,
  gap = 6,
  align = "left",
}: Options): AnchoredMenuBox | null {
  const [box, setBox] = useState<AnchoredMenuBox | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!open || !el) {
      setBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;

    const menuW = matchWidth
      ? Math.min(r.width, vw - pad * 2)
      : Math.min(width, vw - pad * 2);

    let left =
      align === "right"
        ? r.right - menuW
        : align === "stretch"
          ? r.left
          : r.left;
    left = Math.max(pad, Math.min(left, vw - menuW - pad));

    const spaceBelow = vh - r.bottom - gap - pad;
    const spaceAbove = r.top - gap - pad;
    const preferBelow = spaceBelow >= minHeight || spaceBelow >= spaceAbove;
    const height = Math.max(
      minHeight,
      Math.min(maxHeight, preferBelow ? spaceBelow : spaceAbove)
    );
    const top = preferBelow
      ? r.bottom + gap
      : Math.max(pad, r.top - gap - height);

    setBox({
      top,
      left,
      width: menuW,
      maxHeight: height,
    });
  }, [
    open,
    anchorRef,
    width,
    matchWidth,
    minHeight,
    maxHeight,
    gap,
    align,
  ]);

  useLayoutEffect(() => {
    update();
    if (!open) return;
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return box;
}
