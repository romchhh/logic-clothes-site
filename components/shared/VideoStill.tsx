"use client";

import { useEffect, useRef } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const tone = mediaAdjustStyle(adjust);
  const base = src.split("#")[0];
  const stillSrc = autoPlay ? base : `${base}#t=0.1`;
  const frame = mediaFrameStyle(adjust?.frame);

  // Returning to a video slide must restart play — autoPlay attr alone often won't.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (autoPlay) {
      v.muted = true;
      const play = () => {
        void v.play().catch(() => {
          /* autoplay policies / abort */
        });
      };
      if (v.readyState >= 2) play();
      else v.addEventListener("loadeddata", play, { once: true });
      return () => v.removeEventListener("loadeddata", play);
    }
    try {
      v.pause();
    } catch {
      /* ignore */
    }
  }, [autoPlay, stillSrc]);

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
      ref={videoRef}
      key={autoPlay ? `play-${base}` : `still-${base}`}
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
        if (autoPlay) {
          void e.currentTarget.play().catch(() => {});
          return;
        }
        try {
          e.currentTarget.pause();
        } catch {
          /* ignore */
        }
      }}
    />
  );
}
