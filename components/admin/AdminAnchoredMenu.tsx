"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import {
  useAnchoredMenu,
  type AnchoredMenuBox,
} from "@/hooks/useAnchoredMenu";

type Props = {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  matchWidth?: boolean;
  align?: "left" | "right" | "stretch";
  className?: string;
  role?: string;
};

export default function AdminAnchoredMenu({
  open,
  anchorRef,
  onClose,
  children,
  width = 208,
  matchWidth = false,
  align = "right",
  className = "",
  role = "menu",
}: Props) {
  const [ready, setReady] = useState(false);
  const box = useAnchoredMenu({
    open,
    anchorRef,
    width,
    matchWidth,
    align,
  });

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!ready || !open || !box) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[10050] cursor-default bg-transparent"
        aria-label="Закрити меню"
        onClick={onClose}
      />
      <div
        role={role}
        className={`admin-anchored-menu ${className}`.trim()}
        style={boxStyle(box)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

function boxStyle(box: AnchoredMenuBox): CSSProperties {
  return {
    position: "fixed",
    top: box.top,
    left: box.left,
    width: box.width,
    maxHeight: box.maxHeight,
    zIndex: 10060,
  };
}
