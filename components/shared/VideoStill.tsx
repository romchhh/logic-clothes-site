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

  return (
    <video
      src={src}
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
      preload="auto"
      onLoadedData={(e) => {
        const v = e.currentTarget;
        if (autoPlay) return;
        const show = () => v.pause();
        if (v.currentTime > 0.05) {
          show();
          return;
        }
        const onSeeked = () => {
          v.removeEventListener("seeked", onSeeked);
          show();
        };
        v.addEventListener("seeked", onSeeked);
        try {
          v.currentTime = 0.15;
        } catch {
          show();
        }
      }}
    />
  );
}
