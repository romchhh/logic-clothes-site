"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AdminUploadPreloader from "@/components/admin/AdminUploadPreloader";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  DEFAULT_MEDIA_ADJUST,
  type MediaAdjust,
  type MediaFrame,
  mediaAdjustCssFilter,
} from "@/lib/mediaAdjust";
import { renderAdjustedImageBlob } from "@/lib/renderAdjustedImage";

export type MediaEditSession = {
  replaceUrl: string | null;
  mode: "image" | "video";
  file: File | null;
  previewUrl: string;
  naturalW: number;
  naturalH: number;
  initialAdjust?: MediaAdjust;
  /** Original filename for UI */
  label?: string;
};

type EditorTab = "fine" | "crop";

type Props = {
  session: MediaEditSession | null;
  queueIndex?: number;
  queueTotal?: number;
  busy?: boolean;
  onClose: () => void;
  onSkip?: () => void;
  onSaveImage: (
    file: File,
    replaceUrl: string | null,
    adjust: MediaAdjust
  ) => Promise<void>;
  onSaveVideo: (replaceUrl: string, adjust: MediaAdjust) => Promise<void>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.12;

type PanState = { x: number; y: number };

type ToneKey = Exclude<keyof MediaAdjust, "frame">;

const FINE_SLIDERS: {
  key: ToneKey;
  label: string;
  hint: string;
  min: number;
  max: number;
}[] = [
  { key: "brightness", label: "Світло", hint: "Експозиція", min: -100, max: 100 },
  { key: "contrast", label: "Контраст", hint: "Глибина", min: -100, max: 100 },
  {
    key: "warmth",
    label: "Температура",
    hint: "Холодніше ← → Тепліше",
    min: -100,
    max: 100,
  },
  { key: "saturation", label: "Насиченість", hint: "Колір", min: -100, max: 100 },
  { key: "sharpness", label: "Різкість", hint: "Деталі", min: 0, max: 100 },
];

export default function MediaEditModal({
  session,
  queueIndex = 0,
  queueTotal = 0,
  busy = false,
  onClose,
  onSkip,
  onSaveImage,
  onSaveVideo,
}: Props) {
  const [adjust, setAdjust] = useState<MediaAdjust>(DEFAULT_MEDIA_ADJUST);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<EditorTab>("fine");
  const [compare, setCompare] = useState(false);
  const [zoom, setZoom] = useState(1);

  const frameRef = useRef<HTMLDivElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const panRef = useRef<PanState>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const naturalRef = useRef({ w: 0, h: 0 });
  const cropReadyRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pinchRef = useRef<{
    idA: number;
    idB: number;
    startDist: number;
    startZoom: number;
    originX: number;
    originY: number;
    focalX: number;
    focalY: number;
  } | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const rafRef = useRef(0);

  useScrollLock(Boolean(session));

  useEffect(() => {
    if (!session) return;
    setAdjust(session.initialAdjust ?? DEFAULT_MEDIA_ADJUST);
    setTab("crop");
    setCompare(false);
    setSaveError(null);
    cropReadyRef.current = false;
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setZoom(1);
    setVideoPlaying(false);
    naturalRef.current = {
      w: session.naturalW,
      h: session.naturalH,
    };
    pointersRef.current.clear();
    pinchRef.current = null;
  }, [session]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || session?.mode !== "video") return;
    if (videoPlaying) {
      void v.play().catch(() => setVideoPlaying(false));
    } else {
      v.pause();
    }
  }, [session, videoPlaying]);

  const cropNode = useCallback((): HTMLElement | null => {
    return cropImgRef.current ?? videoRef.current;
  }, []);

  const applyPanToDom = useCallback(() => {
    const el = cropNode();
    if (!el) return;
    el.style.transform = `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0)`;
  }, [cropNode]);

  const coverLayout = useCallback(
    (naturalW: number, naturalH: number, zoomLevel = zoomRef.current) => {
      const frame = frameRef.current;
      if (!frame) return null;
      const frameW = frame.clientWidth;
      const frameH = frame.clientHeight;
      if (frameW <= 0 || frameH <= 0) return null;
      const cover = Math.max(frameW / naturalW, frameH / naturalH);
      const scale = cover * zoomLevel;
      const dispW = naturalW * scale;
      const dispH = naturalH * scale;
      const minX = Math.min(0, frameW - dispW);
      const minY = Math.min(0, frameH - dispH);
      return { frameW, frameH, scale, cover, dispW, dispH, minX, minY };
    },
    []
  );

  const applyCoverSize = useCallback(
    (naturalW: number, naturalH: number, recenter: boolean) => {
      const layout = coverLayout(naturalW, naturalH);
      if (!layout) {
        if (recenter) panRef.current = { x: 0, y: 0 };
        return false;
      }
      const el = cropNode();
      if (el) {
        el.style.width = `${layout.dispW}px`;
        el.style.height = `${layout.dispH}px`;
        el.style.maxWidth = "none";
        el.style.maxHeight = "none";
        el.style.objectFit = "fill";
      }
      if (recenter || !cropReadyRef.current) {
        panRef.current = {
          x: (layout.frameW - layout.dispW) / 2,
          y: (layout.frameH - layout.dispH) / 2,
        };
      } else {
        panRef.current = {
          x: clamp(panRef.current.x, layout.minX, 0),
          y: clamp(panRef.current.y, layout.minY, 0),
        };
      }
      applyPanToDom();
      cropReadyRef.current = true;
      return true;
    },
    [applyPanToDom, coverLayout, cropNode]
  );

  const setZoomAround = useCallback(
    (
      nextZoom: number,
      naturalW: number,
      naturalH: number,
      focalX?: number,
      focalY?: number
    ) => {
      const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      const prev = coverLayout(naturalW, naturalH, zoomRef.current);
      if (!prev) {
        zoomRef.current = z;
        setZoom(z);
        return;
      }
      const fx = focalX ?? prev.frameW / 2;
      const fy = focalY ?? prev.frameH / 2;
      const imgX = (fx - panRef.current.x) / prev.scale;
      const imgY = (fy - panRef.current.y) / prev.scale;
      zoomRef.current = z;
      setZoom(z);
      const next = coverLayout(naturalW, naturalH, z);
      if (!next) return;
      const el = cropNode();
      if (el) {
        el.style.width = `${next.dispW}px`;
        el.style.height = `${next.dispH}px`;
        el.style.maxWidth = "none";
        el.style.maxHeight = "none";
        el.style.objectFit = "fill";
      }
      panRef.current = {
        x: clamp(fx - imgX * next.scale, next.minX, 0),
        y: clamp(fy - imgY * next.scale, next.minY, 0),
      };
      applyPanToDom();
      cropReadyRef.current = true;
    },
    [applyPanToDom, coverLayout, cropNode]
  );

  const centerPan = useCallback(
    (naturalW: number, naturalH: number) => {
      zoomRef.current = 1;
      setZoom(1);
      return applyCoverSize(naturalW, naturalH, true);
    },
    [applyCoverSize]
  );

  useEffect(() => {
    if (!session || session.mode !== "image") return;
    cropReadyRef.current = false;
    const run = (recenter: boolean) =>
      applyCoverSize(session.naturalW, session.naturalH, recenter);
    const img = cropImgRef.current;
    if (img?.complete && img.naturalWidth) run(true);
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") {
      const t = window.setTimeout(() => run(true), 50);
      return () => window.clearTimeout(t);
    }
    const ro = new ResizeObserver(() => run(false));
    ro.observe(frame);
    const t = window.setTimeout(() => run(true), 50);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [session, applyCoverSize, tab]);

  const getCropRect = useCallback(() => {
    if (!session || session.mode !== "image") {
      return { x: 0, y: 0, w: 1, h: 1 };
    }
    const layout = coverLayout(session.naturalW, session.naturalH);
    if (!layout) return { x: 0, y: 0, w: 1, h: 1 };
    const { naturalW, naturalH } = session;
    const { scale, frameW, frameH } = layout;
    const { x: panX, y: panY } = panRef.current;
    const srcX = -panX / scale;
    const srcY = -panY / scale;
    const srcW = frameW / scale;
    const srcH = frameH / scale;
    const crop = {
      x: clamp(srcX / naturalW, 0, 1),
      y: clamp(srcY / naturalH, 0, 1),
      w: clamp(srcW / naturalW, 0.01, 1),
      h: clamp(srcH / naturalH, 0.01, 1),
    };
    if (crop.x + crop.w > 1) crop.x = Math.max(0, 1 - crop.w);
    if (crop.y + crop.h > 1) crop.y = Math.max(0, 1 - crop.h);
    return crop;
  }, [coverLayout, session]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!session || tab !== "crop") return;
    if (session.mode !== "image" && session.mode !== "video") return;
    // Ignore secondary buttons; allow touch + pen + primary mouse
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      frameRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.entries()];
      const [, a] = pts[0];
      const [, b] = pts[1];
      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const frame = frameRef.current?.getBoundingClientRect();
      const midX = (a.x + b.x) / 2 - (frame?.left ?? 0);
      const midY = (a.y + b.y) / 2 - (frame?.top ?? 0);
      pinchRef.current = {
        idA: pts[0][0],
        idB: pts[1][0],
        startDist: dist,
        startZoom: zoomRef.current,
        originX: panRef.current.x,
        originY: panRef.current.y,
        focalX: midX,
        focalY: midY,
      };
      dragRef.current = null;
      return;
    }

    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: panRef.current.x,
      originY: panRef.current.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!session || tab !== "crop") return;
    if (session.mode !== "image" && session.mode !== "video") return;
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.preventDefault();

    const pinch = pinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const a = pointersRef.current.get(pinch.idA);
      const b = pointersRef.current.get(pinch.idB);
      if (a && b) {
        const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nextZoom = pinch.startZoom * (dist / pinch.startDist);
        const frame = frameRef.current?.getBoundingClientRect();
        const midX = (a.x + b.x) / 2 - (frame?.left ?? 0);
        const midY = (a.y + b.y) / 2 - (frame?.top ?? 0);
        setZoomAround(
          nextZoom,
          naturalRef.current.w || session.naturalW,
          naturalRef.current.h || session.naturalH,
          midX,
          midY
        );
      }
      return;
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const layout = coverLayout(
      naturalRef.current.w || session.naturalW,
      naturalRef.current.h || session.naturalH
    );
    if (!layout) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    panRef.current = {
      x: clamp(drag.originX + dx, layout.minX, 0),
      y: clamp(drag.originY + dy, layout.minY, 0),
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(applyPanToDom);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pinchRef.current) {
      const { idA, idB } = pinchRef.current;
      if (e.pointerId === idA || e.pointerId === idB) {
        pinchRef.current = null;
        dragRef.current = null;
      }
    }
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
    try {
      frameRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const frame = frameRef.current;
    if (
      !frame ||
      !session ||
      tab !== "crop" ||
      (session.mode !== "image" && session.mode !== "video")
    ) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = frame.getBoundingClientRect();
      const focalX = e.clientX - rect.left;
      const focalY = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoomAround(
        zoomRef.current + delta,
        naturalRef.current.w || session.naturalW,
        naturalRef.current.h || session.naturalH,
        focalX,
        focalY
      );
    };
    frame.addEventListener("wheel", onWheel, { passive: false });
    return () => frame.removeEventListener("wheel", onWheel);
  }, [session, tab, setZoomAround]);

  const previewAdjust = compare ? DEFAULT_MEDIA_ADJUST : adjust;
  const previewFilter = mediaAdjustCssFilter(previewAdjust);

  function onFineChange(key: ToneKey, value: number) {
    setAdjust((prev) => ({ ...prev, [key]: value }));
  }

  function currentFrame(): MediaFrame | undefined {
    const w = naturalRef.current.w || session?.naturalW || 0;
    const h = naturalRef.current.h || session?.naturalH || 0;
    const layout = coverLayout(w, h);
    if (!layout) return undefined;
    const spanX = Math.max(0, layout.dispW - layout.frameW);
    const spanY = Math.max(0, layout.dispH - layout.frameH);
    const x = spanX < 1 ? 50 : clamp((-panRef.current.x / spanX) * 100, 0, 100);
    const y = spanY < 1 ? 50 : clamp((-panRef.current.y / spanY) * 100, 0, 100);
    const zoom = zoomRef.current;
    if (Math.abs(x - 50) < 0.5 && Math.abs(y - 50) < 0.5 && zoom <= 1.001) {
      return undefined;
    }
    return { x, y, zoom };
  }

  function withFrame(base: MediaAdjust): MediaAdjust {
    const frame = currentFrame();
    const next: MediaAdjust = { ...base };
    if (frame) next.frame = frame;
    else delete next.frame;
    return next;
  }

  async function handleSaveWithoutTone() {
    if (!session || session.mode !== "video" || !session.replaceUrl) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveVideo(session.replaceUrl, withFrame(DEFAULT_MEDIA_ADJUST));
    } catch (err) {
      console.error(err);
      setSaveError("Не вдалося зберегти відео");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (session.mode === "video") {
        if (!session.replaceUrl) {
          setSaveError("Немає URL відео");
          return;
        }
        await onSaveVideo(session.replaceUrl, withFrame(adjust));
        return;
      }
      if (!session.file) {
        setSaveError("Файл фото недоступний — закрийте й оберіть знову");
        return;
      }
      const img = cropImgRef.current;
      if (!img) {
        setSaveError("Прев’ю ще не готове — зачекайте секунду");
        return;
      }
      if (!cropReadyRef.current) {
        centerPan(session.naturalW, session.naturalH);
      }
      const crop = getCropRect();
      const blob = await renderAdjustedImageBlob(
        img,
        img.naturalWidth || session.naturalW,
        img.naturalHeight || session.naturalH,
        crop,
        adjust
      );
      const file = new File([blob], "catalog.jpg", { type: "image/jpeg" });
      await onSaveImage(file, session.replaceUrl, adjust);
    } catch (err) {
      console.error(err);
      setSaveError(
        err instanceof Error ? err.message : "Не вдалося зберегти фото"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!session) return null;

  const isVideo = session.mode === "video";
  const disabled = saving || busy;
  const showCropLayer = true;
  const showSkip = Boolean(onSkip) && (isVideo || queueTotal > 1);
  const fileLabel = session.label?.trim();

  const tabs: { id: EditorTab; label: string }[] = [
    { id: "crop", label: "Кадр 3:5" },
    { id: "fine", label: "Тон" },
  ];

  return (
    <div className="media-editor-root" role="presentation">
      <AdminUploadPreloader
        open={saving || busy}
        elevated
        label={
          saving
            ? isVideo
              ? "Збереження…"
              : "Обробка й завантаження фото…"
            : "Завантаження…"
        }
      />
      <button
        type="button"
        className="media-editor-backdrop"
        aria-label="Закрити"
        onClick={onClose}
        disabled={disabled}
      />
      <div
        className="media-editor-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-editor-title"
        data-scroll-lock-allow
      >
        <header className="media-editor-head">
          <div className="min-w-0">
            <p className="media-editor-eyebrow">
              {isVideo ? "Відео · тон на сайті" : "Фото"}
              {queueTotal > 1 ? ` · ${queueIndex} з ${queueTotal}` : ""}
            </p>
            <h2 id="media-editor-title" className="media-editor-title">
              {isVideo ? "Налаштування відео" : "Кадр і тон"}
            </h2>
            {fileLabel ? (
              <p className="media-editor-file-label" title={fileLabel}>
                {fileLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="media-editor-close"
            aria-label="Закрити"
            disabled={disabled}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="media-editor-layout">
          <div className="media-editor-preview-wrap">
            <div
              ref={frameRef}
              className={`media-editor-frame${
                isVideo ? " media-editor-frame--video" : ""
              }${showCropLayer && tab === "crop" ? " is-cropping" : ""}`}
              style={{
                cursor: showCropLayer && tab === "crop" ? "grab" : "default",
                touchAction: "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={session.previewUrl}
                  className="media-editor-crop-layer is-visible"
                  style={
                    previewFilter ? { filter: previewFilter } : undefined
                  }
                  muted
                  playsInline
                  loop
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    const w = v.videoWidth || session.naturalW;
                    const h = v.videoHeight || session.naturalH;
                    naturalRef.current = { w, h };
                    const saved = session.initialAdjust?.frame;
                    centerPan(w, h);
                    if (saved && saved.zoom > 1) {
                      setZoomAround(saved.zoom, w, h);
                    }
                    const layout = coverLayout(w, h);
                    if (layout && saved) {
                      const spanX = Math.max(0, layout.dispW - layout.frameW);
                      const spanY = Math.max(0, layout.dispH - layout.frameH);
                      panRef.current = {
                        x: clamp(
                          spanX < 1 ? panRef.current.x : -(saved.x / 100) * spanX,
                          layout.minX,
                          0
                        ),
                        y: clamp(
                          spanY < 1 ? panRef.current.y : -(saved.y / 100) * spanY,
                          layout.minY,
                          0
                        ),
                      };
                      applyPanToDom();
                    }
                    try {
                      v.currentTime = 0.15;
                    } catch {
                      /* keep first frame */
                    }
                  }}
                />
              ) : (
                /* Same framed crop on both tabs — this is what gets saved. */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  ref={cropImgRef}
                  src={session.previewUrl}
                  alt=""
                  draggable={false}
                  className="media-editor-crop-layer is-visible"
                  style={
                    previewFilter ? { filter: previewFilter } : undefined
                  }
                  onLoad={() =>
                    centerPan(session.naturalW, session.naturalH)
                  }
                />
              )}
              <div className="media-editor-frame-guide" aria-hidden="true" />
              <span className="media-editor-frame-ratio">3 : 5</span>
            </div>

            <div className="media-editor-preview-actions">
              {isVideo && tab !== "crop" ? (
                <button
                  type="button"
                  className={`media-editor-chip${videoPlaying ? " is-active" : ""}`}
                  onClick={() => setVideoPlaying((p) => !p)}
                >
                  {videoPlaying ? "Пауза" : "Грати"}
                </button>
              ) : tab === "crop" ? (
                <div className="media-editor-zoom-bar">
                  <button
                    type="button"
                    className="media-editor-zoom-btn"
                    aria-label="Віддалити"
                    disabled={disabled || zoom <= MIN_ZOOM}
                    onClick={() =>
                      setZoomAround(
                        zoomRef.current - ZOOM_STEP,
                        naturalRef.current.w || session.naturalW,
                        naturalRef.current.h || session.naturalH
                      )
                    }
                  >
                    −
                  </button>
                  <input
                    type="range"
                    className="media-editor-zoom-range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    disabled={disabled}
                    aria-label="Масштаб"
                    onChange={(e) =>
                      setZoomAround(
                        Number(e.target.value),
                        naturalRef.current.w || session.naturalW,
                        naturalRef.current.h || session.naturalH
                      )
                    }
                  />
                  <button
                    type="button"
                    className="media-editor-zoom-btn"
                    aria-label="Наблизити"
                    disabled={disabled || zoom >= MAX_ZOOM}
                    onClick={() =>
                      setZoomAround(
                        zoomRef.current + ZOOM_STEP,
                        naturalRef.current.w || session.naturalW,
                        naturalRef.current.h || session.naturalH
                      )
                    }
                  >
                    +
                  </button>
                  <span className="media-editor-zoom-value">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className={`media-editor-chip${compare ? " is-active" : ""}`}
                  onPointerDown={() => setCompare(true)}
                  onPointerUp={() => setCompare(false)}
                  onPointerLeave={() => setCompare(false)}
                  onPointerCancel={() => setCompare(false)}
                >
                  Утримуй — до / після
                </button>
              )}
            </div>
          </div>

          <div className="media-editor-side">
            <nav className="media-editor-tabs" aria-label="Режим">
              {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`media-editor-tab${
                      tab === t.id ? " is-active" : ""
                    }`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
            </nav>

            <div className="media-editor-scroll" data-scroll-lock-allow>
              {tab === "fine" && (
                <div className="media-editor-fine">
                  {isVideo ? (
                    <p className="media-editor-hint media-editor-hint--video">
                      Вирівняйте тон з фото. Або «Без змін» — відео залишиться
                      як є.
                    </p>
                  ) : (
                    <p className="media-editor-hint">
                      Світло, контраст, температура — коли кадр з іншої камери.
                    </p>
                  )}
                  {FINE_SLIDERS.map(({ key, label, hint, min, max }) => (
                    <label key={key} className="media-editor-slider">
                      <div className="media-editor-slider-top">
                        <span className="media-editor-slider-label">
                          {label}
                        </span>
                        <span className="media-editor-slider-value">
                          {adjust[key]}
                        </span>
                      </div>
                      <span className="media-editor-slider-hint">{hint}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={adjust[key]}
                        className="media-editor-range"
                        onChange={(e) =>
                          onFineChange(key, Number(e.target.value))
                        }
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    className="media-editor-reset"
                    onClick={() => setAdjust(DEFAULT_MEDIA_ADJUST)}
                  >
                    Скинути все
                  </button>
                </div>
              )}

              {tab === "crop" && (
                <div className="media-editor-crop-help">
                  <p className="media-editor-hint">
                    Рамка — як у каталозі (3:5). Перетягніть фото, наблизьте
                    коліщатком / щипком, потім «Додати в галерею».
                  </p>
                  <ul className="media-editor-crop-tips">
                    <li>− / + або слайдер під кадром — масштаб</li>
                    <li>Коліщатко миші або два пальці — зум</li>
                    <li>Тон — на вкладці поруч</li>
                  </ul>
                  <div className="media-editor-zoom-side">
                    <label className="media-editor-slider">
                      <div className="media-editor-slider-top">
                        <span className="media-editor-slider-label">
                          Масштаб
                        </span>
                        <span className="media-editor-slider-value">
                          {Math.round(zoom * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step={0.01}
                        value={zoom}
                        className="media-editor-range"
                        disabled={disabled}
                        onChange={(e) =>
                          setZoomAround(
                            Number(e.target.value),
                            naturalRef.current.w || session.naturalW,
                            naturalRef.current.h || session.naturalH
                          )
                        }
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="media-editor-reset"
                    onClick={() =>
                      centerPan(
                        naturalRef.current.w || session.naturalW,
                        naturalRef.current.h || session.naturalH
                      )
                    }
                  >
                    Скинути кадр
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {saveError ? (
          <p className="media-editor-save-error" role="alert">
            {saveError}
          </p>
        ) : null}

        <footer className="media-editor-foot">
          <button
            type="button"
            className="admin-btn-ghost media-editor-cancel"
            disabled={disabled}
            onClick={onClose}
          >
            Скасувати
          </button>
          <div className="media-editor-foot-right">
            {showSkip ? (
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={disabled}
                onClick={() => {
                  if (isVideo) void handleSaveWithoutTone();
                  else onSkip?.();
                }}
              >
                {isVideo ? "Без змін" : "Пропустити"}
              </button>
            ) : null}
            <button
              type="button"
              className="admin-btn-primary media-editor-save"
              disabled={disabled}
              onClick={() => void handleSave()}
            >
              {saving
                ? "Збереження…"
                : isVideo
                  ? "Зберегти тон"
                  : session.replaceUrl
                    ? "Застосувати"
                    : "Додати в галерею"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
