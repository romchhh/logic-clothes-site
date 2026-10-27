"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function ProductImmersiveGallery({
  images,
  alt,
  prevLabel,
  nextLabel,
  closeLabel = "Close",
}: {
  images: string[];
  alt: string;
  prevLabel: string;
  nextLabel: string;
  closeLabel?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    active: false,
    pointerId: null as number | null,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const goTo = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(images.length - 1, i));
      setIndex(next);
      const el = trackRef.current;
      if (!el || el.offsetParent === null) return;
      const slide = el.children[next] as HTMLElement | undefined;
      if (slide) {
        el.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
      }
    },
    [images.length]
  );

  useEffect(() => {
    setIndex(0);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "auto" });
  }, [images]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || images.length < 2) return;

    function onScroll() {
      const w = el!.clientWidth || 1;
      const i = Math.round(el!.scrollLeft / w);
      if (i >= 0 && i < images.length && i !== index) setIndex(i);
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [images.length, index]);

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
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLightboxIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setLightboxIndex((i) => Math.min(images.length - 1, i + 1));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length]);

  function openLightbox(i: number) {
    setLightboxIndex(i);
    setLightboxOpen(true);
  }

  function onTrackPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = trackRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    el.classList.add("is-dragging");
    el.setPointerCapture(e.pointerId);
  }

  function onTrackPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 8) drag.moved = true;
    if (drag.moved) el.scrollLeft = drag.startScroll - dx;
  }

  function endTrackDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;
    el.classList.remove("is-dragging");
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const w = el.clientWidth || 1;
    const nearest = Math.round(el.scrollLeft / w);
    el.scrollTo({ left: nearest * w, behavior: "smooth" });
    drag.active = false;
    drag.pointerId = null;
  }

  if (!images.length) return null;

  const multi = images.length > 1;

  return (
    <div className="pdp-immerse-root">
      <section className="pdp-immerse-hero" aria-label={alt}>
        <button
          type="button"
          className="pdp-immerse-hero-hit"
          onClick={() => openLightbox(index)}
          aria-label={`${alt} — ${index + 1}`}
        >
          <Image
            src={images[index]}
            alt={`${alt} — ${index + 1}`}
            fill
            priority
            sizes="(max-width: 1023px) 100vw, (min-width: 1024px) 42vw, 58vw"
            quality={90}
            draggable={false}
            className="pdp-immerse-hero-img"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </button>
        {multi && (
          <>
            <button
              type="button"
              className="pdp-immerse-hero-nav pdp-immerse-hero-nav--prev"
              aria-label={prevLabel}
              disabled={index === 0}
              onClick={() => goTo(index - 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className="pdp-immerse-hero-nav pdp-immerse-hero-nav--next"
              aria-label={nextLabel}
              disabled={index >= images.length - 1}
              onClick={() => goTo(index + 1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </section>

      {multi && (
        <section className="pdp-immerse-angles" aria-label={alt}>
          <div className="pdp-immerse-thumbs" role="tablist">
            {images.map((src, i) => (
              <button
                key={`${src}-thumb-${i}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`pdp-immerse-thumb${i === index ? " is-active" : ""}`}
                onClick={() => goTo(i)}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="64px"
                  draggable={false}
                  style={{ objectFit: "cover" }}
                />
              </button>
            ))}
          </div>
          <div
            className="pdp-immerse-track"
            ref={trackRef}
            onPointerDown={onTrackPointerDown}
            onPointerMove={onTrackPointerMove}
            onPointerUp={endTrackDrag}
            onPointerCancel={endTrackDrag}
          >
            {images.map((src, i) => (
              <figure key={`${src}-slide-${i}`} className="pdp-immerse-slide">
                <button
                  type="button"
                  className="pdp-immerse-slide-hit"
                  onClick={() => openLightbox(i)}
                  aria-label={`${alt} — ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt={`${alt} — ${i + 1}`}
                    fill
                    sizes="100vw"
                    quality={85}
                    draggable={false}
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                </button>
              </figure>
            ))}
          </div>
        </section>
      )}

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
            onClick={() => setLightboxOpen(false)}
          />
          <button
            type="button"
            className="pdp-lightbox-close"
            aria-label={closeLabel}
            onClick={() => setLightboxOpen(false)}
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
                  lightboxIndex >= images.length - 1 ? " is-disabled" : ""
                }`}
                aria-label={nextLabel}
                disabled={lightboxIndex >= images.length - 1}
                onClick={() =>
                  setLightboxIndex((i) => Math.min(images.length - 1, i + 1))
                }
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div className="pdp-lightbox-track" ref={lightboxTrackRef}>
            {images.map((src, i) => (
              <figure className="pdp-lightbox-slide" key={`lb-${src}-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${alt} — ${i + 1}`}
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              </figure>
            ))}
          </div>
          {multi && (
            <p className="pdp-lightbox-count" aria-live="polite">
              {lightboxIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
