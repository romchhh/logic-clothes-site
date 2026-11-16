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
  const frame = mediaFrameStyle(adjust?.frame);
  const showPosterCover = !autoPlay && Boolean(poster);

  // Keep the same <video> mounted so returning to the slide can restart play.
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
      else {
        v.addEventListener("loadeddata", play, { once: true });
        return () => v.removeEventListener("loadeddata", play);
      }
      return;
    }
    try {
      v.pause();
      if (Number.isFinite(v.duration) && v.duration > 0) {
        v.currentTime = Math.min(0.1, v.duration * 0.05);
      }
    } catch {
      /* ignore */
    }
  }, [autoPlay, base]);

  return (
    <span
      className={className ? `video-still ${className}` : "video-still"}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        background: "#111",
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        src={base}
        poster={poster || undefined}
        className={className}
        style={{
          width: "100%",
          height: "100%",
          background: "#111",
          ...frame,
          ...tone,
          ...(showPosterCover ? { opacity: 0 } : null),
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
      {showPosterCover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster || ""}
          alt=""
          className={className}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            ...frame,
            ...tone,
          }}
          draggable={false}
        />
      ) : null}
    </span>
  );
}
