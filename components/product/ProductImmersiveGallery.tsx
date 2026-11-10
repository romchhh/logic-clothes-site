"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { MediaAdjust } from "@/lib/mediaAdjust";
import VideoStill from "@/components/shared/VideoStill";

export type GallerySlide = {
  url: string;
  type: "image" | "video";
  adjust?: MediaAdjust;
  poster?: string;
};

export default function ProductImmersiveGallery({
  slides,
  alt,
  prevLabel,
  nextLabel,
  closeLabel = "Close",
}: {
  slides: GallerySlide[];
  alt: string;
  prevLabel: string;
  nextLabel: string;
  closeLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const ignoreScrollRef = useRef(false);
  const tapRef = useRef({
    x: 0,
    y: 0,
    t: 0,
    scrolling: false,
  });

  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const multi = slides.length > 1;

  const goTo = useCallback(
    (i: number, behavior: ScrollBehavior = "smooth") => {
      const next = Math.max(0, Math.min(slides.length - 1, i));
      indexRef.current = next;
      setIndex(next);
      const el = trackRef.current;
      if (!el) return;
      const width = el.clientWidth || 0;
      if (width <= 0) return;
      ignoreScrollRef.current = true;
      el.scrollTo({ left: next * width, behavior });
      window.setTimeout(() => {
        ignoreScrollRef.current = false;
      }, behavior === "smooth" ? 420 : 80);
    },
    [slides.length]
  );

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [slides]);

  // Keep scroll position aligned after layout / resize.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.clientWidth || 0;
      if (w <= 0) return;
      el.scrollTo({ left: indexRef.current * w, behavior: "auto" });
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slides.length]);

  useEffect(() => {
    const root = thumbsRef.current;
    if (!root) return;
    const active = root.querySelector<HTMLElement>(
      ".pdp-immerse-thumb.is-active"
    );
    if (!active) return;
    // Scroll only the thumbs strip horizontally — never the page
    // (scrollIntoView was nudging the viewport down on swipe).
    const rootRect = root.getBoundingClientRect();
    const thumbRect = active.getBoundingClientRect();
    const nextLeft =
      root.scrollLeft +
      (thumbRect.left - rootRect.left) -
      (rootRect.width - thumbRect.width) / 2;
    root.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: "smooth",
    });
  }, [index]);

  useScrollLock(lightboxOpen);

  useEffect(() => {
    if (!lightboxOpen) return;
    const el = lightboxTrackRef.current;
    if (!el) return;
    const slide = el.children[lightboxIndex] as HTMLElement | undefined;
    if (slide) el.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
  }, [lightboxOpen, lightboxIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setLightboxOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLightboxIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setLightboxIndex((i) => Math.min(slides.length - 1, i + 1));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, slides.length]);

  const wasLightboxOpenRef = useRef(false);
  useEffect(() => {
    if (wasLightboxOpenRef.current && !lightboxOpen) {
      goTo(lightboxIndex, "auto");
    }
    wasLightboxOpenRef.current = lightboxOpen;
  }, [lightboxOpen, lightboxIndex, goTo]);

  function onTrackScroll() {
    const el = trackRef.current;
    if (!el || ignoreScrollRef.current) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== indexRef.current && idx >= 0 && idx < slides.length) {
      indexRef.current = idx;
      setIndex(idx);
    }
  }

  function onLightboxScroll() {
    const el = lightboxTrackRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== lightboxIndex && idx >= 0 && idx < slides.length) {
      setLightboxIndex(idx);
    }
  }

  function openLightbox(i: number) {
    setLightboxIndex(i);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function onSlidePointerDown(e: React.PointerEvent) {
    tapRef.current = {
      x: e.clientX,
      y: e.clientY,
      t: Date.now(),
      scrolling: false,
    };
  }

  function onSlidePointerMove(e: React.PointerEvent) {
    const tap = tapRef.current;
    if (
      Math.abs(e.clientX - tap.x) > 8 ||
      Math.abs(e.clientY - tap.y) > 8
    ) {
      tap.scrolling = true;
    }
  }

  function onSlideClick(i: number) {
    const tap = tapRef.current;
    if (tap.scrolling) return;
    if (Date.now() - tap.t > 450) return;
    openLightbox(i);
  }

  if (!slides.length) return null;

  return (
    <div className="pdp-immerse-root">
      <section className="pdp-immerse-hero" aria-label={alt}>
        <div
          className="pdp-immerse-hero-track"
          ref={trackRef}
          onScroll={onTrackScroll}
        >
          {slides.map((slide, i) => (
            <figure
              className="pdp-immerse-hero-slide"
              key={`${slide.url}-hero-${i}`}
              onPointerDown={onSlidePointerDown}
              onPointerMove={onSlidePointerMove}
              onClick={() => onSlideClick(i)}
            >
              {slide.type === "video" ? (
                <VideoStill
                  src={slide.url}
                  adjust={slide.adjust}
                  poster={slide.poster}
                  autoPlay={i === index}
                  className="pdp-immerse-hero-img"
                />
              ) : (
                <Image
                  src={slide.url}
                  alt={`${alt} — ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1023px) 100vw, (min-width: 1024px) 42vw, 58vw"
                  quality={90}
                  draggable={false}
                  className="pdp-immerse-hero-img"
                  style={{ objectFit: "cover", objectPosition: "center" }}
                />
              )}
            </figure>
          ))}
        </div>

        {multi && (
          <>
            <button
              type="button"
              className="pdp-immerse-hero-nav pdp-immerse-hero-nav--prev"
              aria-label={prevLabel}
              disabled={index === 0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(index - 1);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="pdp-immerse-hero-nav pdp-immerse-hero-nav--next"
              aria-label={nextLabel}
              disabled={index >= slides.length - 1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(index + 1);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </section>

      <section className="pdp-immerse-angles" aria-label={alt}>
        <div className="pdp-immerse-thumbs" role="tablist" ref={thumbsRef}>
          {slides.map((slide, i) => (
            <button
              key={`${slide.url}-thumb-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`pdp-immerse-thumb${i === index ? " is-active" : ""}${
                slide.type === "video" ? " is-video" : ""
              }`}
              onClick={() => goTo(i)}
            >
              {slide.type === "video" ? (
                <VideoStill
                  src={slide.url}
                  adjust={slide.adjust}
                  poster={slide.poster}
                />
              ) : (
                <Image
                  src={slide.url}
                  alt=""
                  fill
                  sizes="72px"
                  draggable={false}
                  style={{ objectFit: "cover" }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {lightboxOpen && (
        <div
          className="pdp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            className="pdp-lightbox-backdrop"
            aria-label={closeLabel}
            onClick={closeLightbox}
          />
          <button
            type="button"
            className="pdp-lightbox-close"
            aria-label={closeLabel}
            onClick={closeLightbox}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {multi && (
            <>
              <button
                type="button"
                className={`pdp-lightbox-nav pdp-lightbox-nav--prev${
                  lightboxIndex === 0 ? " is-disabled" : ""
                }`}
                aria-label={prevLabel}
                disabled={lightboxIndex === 0}
                onClick={() =>
                  setLightboxIndex((i) => Math.max(0, i - 1))
                }
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                className={`pdp-lightbox-nav pdp-lightbox-nav--next${
                  lightboxIndex >= slides.length - 1 ? " is-disabled" : ""
                }`}
                aria-label={nextLabel}
                disabled={lightboxIndex >= slides.length - 1}
                onClick={() =>
                  setLightboxIndex((i) =>
                    Math.min(slides.length - 1, i + 1)
                  )
                }
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div
            className="pdp-lightbox-track"
            ref={lightboxTrackRef}
            onScroll={onLightboxScroll}
          >
            {slides.map((slide, i) => (
              <figure
                className="pdp-lightbox-slide"
                key={`lb-${slide.url}-${i}`}
              >
                {slide.type === "video" ? (
                  <VideoStill
                    src={slide.url}
                    adjust={slide.adjust}
                    poster={slide.poster}
                    autoPlay={i === lightboxIndex}
                    className="h-full w-full"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.url}
                    alt={`${alt} — ${i + 1}`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                )}
              </figure>
            ))}
          </div>
          {multi && (
            <p className="pdp-lightbox-count" aria-live="polite">
              {lightboxIndex + 1} / {slides.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
