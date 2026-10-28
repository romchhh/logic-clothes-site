"use client";

import type { CSSProperties } from "react";
import { mediaAdjustStyle, type MediaAdjust } from "@/lib/mediaAdjust";

export function mediaAdjustProps(adjust?: MediaAdjust): {
  style?: CSSProperties;
} {
  const tone = mediaAdjustStyle(adjust);
  return tone ? { style: tone } : {};
}

export default function MediaWithAdjust({
  adjust,
  className,
  children,
}: {
  adjust?: MediaAdjust;
  className?: string;
  children: React.ReactNode;
}) {
  const tone = mediaAdjustStyle(adjust);
  return (
    <div className={className} style={tone}>
      {children}
    </div>
  );
}
