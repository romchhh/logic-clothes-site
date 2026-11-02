"use client";

import {
  mediaAdjustStyle,
  mediaFrameStyle,
  type MediaAdjust,
} from "@/lib/mediaAdjust";

/** Paints a decoded frame instead of the native gray play button. */
export default function VideoStill({
  src,
  adjust,
  className,
  autoPlay = false,
}: {
  src: string;
  adjust?: MediaAdjust;
  className?: string;
  autoPlay?: boolean;
}) {
  const tone = mediaAdjustStyle(adjust);
  const base = src.split("#")[0];
  const stillSrc = autoPlay ? base : `${base}#t=0.1`;

  return (
    <video
      src={stillSrc}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background: "#111",
        ...mediaFrameStyle(adjust?.frame),
        ...tone,
      }}
      muted
      playsInline
      loop={autoPlay}
      autoPlay={autoPlay}
      preload={autoPlay ? "auto" : "metadata"}
      onLoadedData={(e) => {
        if (autoPlay) return;
        try {
          e.currentTarget.pause();
        } catch {
          /* ignore */
        }
      }}
    />
  );
}
