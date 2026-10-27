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
  const lightboxTrackRef = useRef<HTMLDivElement>(null);
  const heroDragRef = useRef({
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
    },
    [images.length]
  );

  useEffect(() => {
    setIndex(0);
  }, [images]);

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

  function onHeroPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (!multi) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    heroDragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: 0,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onHeroPointerMove(e: ReactPointerEvent<HTMLElement>) {
    const drag = heroDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 10) drag.moved = true;
  }

  function endHeroDrag(e: ReactPointerEvent<HTMLElement>) {
    const drag = heroDragRef.current;
    if (!drag.active || drag.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const dx = e.clientX - drag.startX;
    if (drag.moved) {
      if (dx < -48) goTo(index + 1);
      else if (dx > 48) goTo(index - 1);
    }
    drag.active = false;
    drag.pointerId = null;
    drag.moved = false;
  }

  if (!images.length) return null;

  const multi = images.length > 1;

  return (
    <div className="pdp-immerse-root">
      <section
        className="pdp-immerse-hero"
        aria-label={alt}
        onPointerDown={onHeroPointerDown}
        onPointerMove={onHeroPointerMove}
        onPointerUp={endHeroDrag}
        onPointerCancel={endHeroDrag}
      >
        <button
          type="button"
          className="pdp-immerse-hero-hit"
          onClick={(e) => {
            if (heroDragRef.current.moved) {
              e.preventDefault();
              return;
            }
            openLightbox(index);
          }}
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
