"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

export default function ProductGallery({
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
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startScroll: number;
    moved: boolean;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startScroll: 0,
    moved: false,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const getStep = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const first = el.querySelector<HTMLElement>(".pdp-gallery-item");
    if (!first) return el.clientWidth;
    const styles = getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
    return first.offsetWidth + gap;
  }, []);

  const syncControls = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    setCanPrev(left > 4);
    setCanNext(left < maxScroll - 4);

    const step = getStep();
    if (step <= 0) {
      setPage(0);
      setPageCount(1);
      return;
    }
    const pages = Math.max(1, Math.round(maxScroll / step) + 1);
    setPageCount(pages);
    setPage(Math.min(pages - 1, Math.round(left / step)));
  }, [getStep]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncControls();
    el.addEventListener("scroll", syncControls, { passive: true });
    const ro = new ResizeObserver(syncControls);
    ro.observe(el);
    window.addEventListener("resize", syncControls);
    return () => {
      el.removeEventListener("scroll", syncControls);
      ro.disconnect();
      window.removeEventListener("resize", syncControls);
    };
  }, [images, syncControls]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const el = lightboxTrackRef.current;
    if (!el) return;
    const slide = el.children[lightboxIndex] as HTMLElement | undefined;
    if (slide) {
      el.scrollTo({ left: slide.offsetLeft, behavior: "auto" });
    }
  }, [lightboxOpen, lightboxIndex]);

  useEffect(() => {
    if (!lightboxOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxOpen(false);
        return;
      }
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

  function scrollByDir(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: getStep() * dir, behavior: "smooth" });
  }

  function goToPage(index: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: getStep() * index, behavior: "smooth" });
  }

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function lightboxPrev() {
    setLightboxIndex((i) => Math.max(0, i - 1));
  }

  function lightboxNext() {
    setLightboxIndex((i) => Math.min(images.length - 1, i + 1));
  }

  function onLightboxScroll() {
    const el = lightboxTrackRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== lightboxIndex && idx >= 0 && idx < images.length) {
      setLightboxIndex(idx);
    }
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
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

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 4) drag.moved = true;
    el.scrollLeft = drag.startScroll - dx;
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const el = trackRef.current;
    if (!drag.active || !el || drag.pointerId !== e.pointerId) return;
    el.classList.remove("is-dragging");
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const dx = e.clientX - drag.startX;
    const wasMoved = drag.moved;
    drag.active = false;
    drag.pointerId = null;

    if (Math.abs(dx) > 40) {
      scrollByDir(dx < 0 ? 1 : -1);
      return;
    }

    const step = getStep();
    if (step > 0) {
      const nearest = Math.round(el.scrollLeft / step);
      el.scrollTo({ left: nearest * step, behavior: "smooth" });
    }

    if (!wasMoved) {
      const target = (e.target as HTMLElement | null)?.closest(
        ".pdp-gallery-item"
      );
      if (target && el.contains(target)) {
        const items = Array.from(el.querySelectorAll(".pdp-gallery-item"));
        const index = items.indexOf(target);
        if (index >= 0) openLightbox(index);
      }
    }
  }

  if (!images.length) return null;

  const single = images.length === 1;

  return (
    <>
      <div className={`pdp-slider${single ? " is-single" : ""}`}>
        <div
          className={`pdp-gallery${single ? " is-single" : ""}`}
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {images.map((src, i) => (
            <figure className="pdp-gallery-item" key={`${src}-${i}`}>
              <Image
                src={src}
                alt={`${alt} — ${i + 1}`}
                width={900}
                height={1200}
                sizes="(max-width: 959px) 100vw, 50vw"
                quality={85}
                priority={i === 0}
                draggable={false}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  pointerEvents: "none",
                }}
              />
            </figure>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`pdp-nav pdp-nav--prev${canPrev ? "" : " is-disabled"}`}
              aria-label={prevLabel}
              disabled={!canPrev}
              onClick={() => scrollByDir(-1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={`pdp-nav pdp-nav--next${canNext ? "" : " is-disabled"}`}
              aria-label={nextLabel}
              disabled={!canNext}
              onClick={() => scrollByDir(1)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {pageCount > 1 && (
              <div className="pdp-dots" role="tablist" aria-label="Gallery">
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`pdp-dot${i === page ? " is-active" : ""}`}
                    aria-label={`${i + 1}`}
                    aria-current={i === page ? "true" : undefined}
                    onClick={() => goToPage(i)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

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

          {images.length > 1 && (
            <>
              <button
                type="button"
                className={`pdp-lightbox-nav pdp-lightbox-nav--prev${
                  lightboxIndex === 0 ? " is-disabled" : ""
                }`}
                aria-label={prevLabel}
                disabled={lightboxIndex === 0}
                onClick={lightboxPrev}
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
                onClick={lightboxNext}
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

          {images.length > 1 && (
            <p className="pdp-lightbox-count" aria-live="polite">
              {lightboxIndex + 1} / {images.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
