"use client";

import { useEffect, useRef, useState } from "react";
import {
  mediaAdjustStyle,
  mediaFrameStyle,
  type MediaAdjust,
} from "@/lib/mediaAdjust";

type Props = {
  src: string;
  adjust?: MediaAdjust;
  poster?: string | null;
  className?: string;
};

/** Admin grid: poster or tiny metadata seek — never downloads the full file. */
export default function AdminVideoThumb({
  src,
  adjust,
  poster,
  className = "absolute inset-0 h-full w-full",
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const tone = mediaAdjustStyle(adjust);
  const frame = mediaFrameStyle(adjust?.frame);

  useEffect(() => {
    const el = ref.current;
    if (!el || poster) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [poster, src]);

  if (poster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt=""
        className={className}
        style={{ ...frame, ...tone }}
        draggable={false}
      />
    );
  }

  return (
    <video
      ref={ref}
      className={className}
      style={{
        background: "#111",
        ...frame,
        ...tone,
      }}
      muted
      playsInline
      preload={active ? "metadata" : "none"}
      src={active ? `${src.split("#")[0]}#t=0.1` : undefined}
      onLoadedData={(e) => {
        const v = e.currentTarget;
        try {
          v.pause();
        } catch {
          /* ignore */
        }
      }}
    />
  );
}
