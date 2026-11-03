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
  poster,
  className,
  autoPlay = false,
}: {
  src: string;
  adjust?: MediaAdjust;
  /** Chosen cover — shown before play and in thumbs. */
  poster?: string | null;
  className?: string;
  autoPlay?: boolean;
}) {
  const tone = mediaAdjustStyle(adjust);
  const base = src.split("#")[0];
  const stillSrc = autoPlay ? base : `${base}#t=0.1`;
  const frame = mediaFrameStyle(adjust?.frame);

  // Thumb / paused: prefer static cover so a bad first frame never flashes.
  if (!autoPlay && poster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        className={className}
        style={{
          width: "100%",
          height: "100%",
          background: "#111",
          ...frame,
          ...tone,
        }}
        draggable={false}
      />
    );
  }

  return (
    <video
      src={stillSrc}
      poster={poster || undefined}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        background: "#111",
        ...frame,
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
