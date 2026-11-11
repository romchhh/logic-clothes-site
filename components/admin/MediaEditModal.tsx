"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminUploadPreloader from "@/components/admin/AdminUploadPreloader";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  captureVideoPosterFile,
  seekVideo,
} from "@/lib/captureVideoPoster";
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
  /** Saved video cover URL, if any */
  initialPoster?: string | null;
  /** Original filename for UI */
  label?: string;
};

export type VideoPosterSave =
  | { kind: "keep"; url: string }
  | { kind: "file"; file: File }
  | { kind: "none" };

type EditorTab = "fine" | "crop" | "poster";

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
  onSaveVideo: (
    replaceUrl: string,
    adjust: MediaAdjust,
    poster: VideoPosterSave
  ) => Promise<void>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const MAX_ZOOM = 4;
const ZOOM_STEP = 0.12;

type PanState = { x: number; y: number };

type ToneKey = Exclude<keyof MediaAdjust, "frame">;

/** Instagram-style: one tool at a time (incl. horizon). */
const TONE_TOOLS: {
  key: ToneKey;
  label: string;
  hint: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "brightness", label: "Світло", hint: "Експозиція", min: -100, max: 100, step: 1 },
  { key: "contrast", label: "Контраст", hint: "Глибина", min: -100, max: 100, step: 1 },
  {
    key: "warmth",
    label: "Тепло",
    hint: "Холодніше ← → Тепліше",
    min: -100,
    max: 100,
    step: 1,
  },
  { key: "saturation", label: "Насич.", hint: "Колір", min: -100, max: 100, step: 1 },
  { key: "sharpness", label: "Різкість", hint: "Деталі", min: 0, max: 100, step: 1 },
  {
    key: "rotate",
    label: "Горизонт",
    hint: "Вирівняти нахил",
    min: -15,
    max: 15,
    step: 0.5,
  },
];

/** Zoom 1 = contain (full photo visible in 3:5). Zoom in to crop. */
function minZoomFor(): number {
  return 1;
}

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
  const [toneTool, setToneTool] = useState<(typeof TONE_TOOLS)[number]["key"]>(
    "brightness"
  );
  const [compare, setCompare] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterCleared, setPosterCleared] = useState(false);
  const [posterBusy, setPosterBusy] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const panRef = useRef<PanState>({ x: 0, y: 0 });
  const zoomRef = useRef(1);
  const naturalRef = useRef({ w: 0, h: 0 });
  const cropReadyRef = useRef(false);
  const posterObjectUrlRef = useRef<string | null>(null);
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session) return;
    const initial = session.initialAdjust ?? DEFAULT_MEDIA_ADJUST;
    setAdjust(initial);
    rotateRef.current = initial.rotate ?? 0;
    setTab(session.mode === "video" ? "poster" : "crop");
    setToneTool("brightness");
    setCompare(false);
    setSaveError(null);
    cropReadyRef.current = false;
    panRef.current = { x: 0, y: 0 };
    zoomRef.current = 1;
    setZoom(1);
    setVideoPlaying(false);
    setVideoDuration(0);
    setVideoTime(0);
    if (posterObjectUrlRef.current) {
      URL.revokeObjectURL(posterObjectUrlRef.current);
      posterObjectUrlRef.current = null;
    }
    setPosterFile(null);
    setPosterCleared(false);
    setPosterPreview(session.initialPoster?.trim() || null);
    setPosterBusy(false);
    naturalRef.current = {
      w: session.naturalW,
      h: session.naturalH,
    };
    pointersRef.current.clear();
    pinchRef.current = null;
  }, [session]);

  useEffect(() => {
    return () => {
      if (posterObjectUrlRef.current) {
        URL.revokeObjectURL(posterObjectUrlRef.current);
        posterObjectUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || session?.mode !== "video") return;
    if (tab === "poster") {
      v.pause();
      setVideoPlaying(false);
      return;
    }
    if (videoPlaying) {
      void v.play().catch(() => setVideoPlaying(false));
    } else {
      v.pause();
    }
  }, [session, videoPlaying, tab]);

  const cropNode = useCallback((): HTMLElement | null => {
    return cropImgRef.current ?? videoRef.current;
  }, []);

  const rotateRef = useRef(0);

  const applyPanToDom = useCallback(() => {
    const el = cropNode();
    if (!el) return;
    const rot = rotateRef.current;
    el.style.transform =
      Math.abs(rot) > 0.05
        ? `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0) rotate(${rot}deg)`
        : `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0)`;
  }, [cropNode]);

  const coverLayout = useCallback(
    (naturalW: number, naturalH: number, zoomLevel = zoomRef.current) => {
      const frame = frameRef.current;
      if (!frame) return null;
      const frameW = frame.clientWidth;
      const frameH = frame.clientHeight;
      if (frameW <= 0 || frameH <= 0 || naturalW <= 0 || naturalH <= 0) {
        return null;
      }
      // Contain at zoom=1 — never crop top/bottom (or sides) by default.
      const contain = Math.min(frameW / naturalW, frameH / naturalH);
      const scale = contain * zoomLevel;
      const dispW = naturalW * scale;
      const dispH = naturalH * scale;
      const minX =
        dispW <= frameW + 0.5 ? (frameW - dispW) / 2 : frameW - dispW;
      const maxX = dispW <= frameW + 0.5 ? (frameW - dispW) / 2 : 0;
      const minY =
        dispH <= frameH + 0.5 ? (frameH - dispH) / 2 : frameH - dispH;
      const maxY = dispH <= frameH + 0.5 ? (frameH - dispH) / 2 : 0;
      return {
        frameW,
        frameH,
        scale,
        cover: contain,
        dispW,
        dispH,
        minX,
        maxX,
        minY,
        maxY,
        minZoom: minZoomFor(),
      };
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
          x: clamp(panRef.current.x, layout.minX, layout.maxX),
          y: clamp(panRef.current.y, layout.minY, layout.maxY),
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
      const layoutHint = coverLayout(naturalW, naturalH, 1);
      const zMin = layoutHint?.minZoom ?? 0.5;
      const z = clamp(nextZoom, zMin, MAX_ZOOM);
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
        x: clamp(fx - imgX * next.scale, next.minX, next.maxX),
        y: clamp(fy - imgY * next.scale, next.minY, next.maxY),
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

  // Frame grows in tone mode — re-fit cover after layout settles.
  useEffect(() => {
    if (!session || tab !== "fine") return;
    const id = window.requestAnimationFrame(() => {
      applyCoverSize(
        naturalRef.current.w || session.naturalW,
        naturalRef.current.h || session.naturalH,
        false
      );
    });
    return () => window.cancelAnimationFrame(id);
  }, [session, tab, applyCoverSize]);

  useEffect(() => {
    if (!session || (session.mode !== "image" && session.mode !== "video"))
      return;
    cropReadyRef.current = false;
    const nw =
      session.mode === "video"
        ? naturalRef.current.w || session.naturalW
        : session.naturalW;
    const nh =
      session.mode === "video"
        ? naturalRef.current.h || session.naturalH
        : session.naturalH;
    const t = window.setTimeout(() => {
      applyCoverSize(nw, nh, true);
    }, 0);
    return () => window.clearTimeout(t);
  }, [session, applyCoverSize]);

  useEffect(() => {
    if (!session || (session.mode !== "image" && session.mode !== "video"))
      return;
    const nw =
      session.mode === "video"
        ? naturalRef.current.w || session.naturalW
        : session.naturalW;
    const nh =
      session.mode === "video"
        ? naturalRef.current.h || session.naturalH
        : session.naturalH;
    const run = (recenter: boolean) => applyCoverSize(nw, nh, recenter);
    if (session.mode === "image") {
      const img = cropImgRef.current;
      if (img?.complete && img.naturalWidth) run(false);
    }
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => run(false));
    ro.observe(frame);
    return () => ro.disconnect();
  }, [session, applyCoverSize]);

  /** View window in normalized source coords (may extend outside 0…1 for letterbox). */
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
    return {
      x: srcX / naturalW,
      y: srcY / naturalH,
      w: Math.max(0.01, srcW / naturalW),
      h: Math.max(0.01, srcH / naturalH),
    };
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
      x: clamp(drag.originX + dx, layout.minX, layout.maxX),
      y: clamp(drag.originY + dy, layout.minY, layout.maxY),
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
    if (key === "rotate") {
      rotateRef.current = value;
      applyPanToDom();
    }
    setAdjust((prev) => {
      const frame = currentFrame();
      const next: MediaAdjust = { ...prev, [key]: value };
      if (key === "rotate" && Math.abs(value) < 0.05) delete next.rotate;
      if (frame) next.frame = frame;
      else delete next.frame;
      return next;
    });
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

  function currentPosterSave(): VideoPosterSave {
    if (posterFile) return { kind: "file", file: posterFile };
    if (posterCleared) return { kind: "none" };
    const keep = posterPreview?.trim() || session?.initialPoster?.trim();
    if (keep) return { kind: "keep", url: keep };
    return { kind: "none" };
  }

  async function pickPosterFromCurrentFrame() {
    const v = videoRef.current;
    if (!v || !session || session.mode !== "video") return;
    setPosterBusy(true);
    setSaveError(null);
    try {
      v.pause();
      setVideoPlaying(false);
      const file = await captureVideoPosterFile(v, 960, "video-poster.jpg");
      if (posterObjectUrlRef.current) {
        URL.revokeObjectURL(posterObjectUrlRef.current);
      }
      const preview = URL.createObjectURL(file);
      posterObjectUrlRef.current = preview;
      setPosterFile(file);
      setPosterPreview(preview);
      setPosterCleared(false);
    } catch (err) {
      console.error(err);
      setSaveError("Не вдалося зняти кадр для обкладинки");
    } finally {
      setPosterBusy(false);
    }
  }

  async function scrubVideoTo(time: number) {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setVideoPlaying(false);
    setVideoTime(time);
    try {
      await seekVideo(v, time);
      setVideoTime(v.currentTime);
    } catch {
      /* ignore seek errors */
    }
  }

  async function handleSaveWithoutTone() {
    if (!session || session.mode !== "video" || !session.replaceUrl) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveVideo(
        session.replaceUrl,
        withFrame(DEFAULT_MEDIA_ADJUST),
        currentPosterSave()
      );
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
        await onSaveVideo(
          session.replaceUrl,
          withFrame(adjust),
          currentPosterSave()
        );
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

  if (!session || !mounted || typeof document === "undefined") return null;

  const isVideo = session.mode === "video";
  const disabled = saving || busy || posterBusy;
  const showCropLayer = tab === "crop";
  const showSkip = Boolean(onSkip) && (isVideo || queueTotal > 1);
  const fileLabel = session.label?.trim();
  const liveMinZoom =
    coverLayout(
      naturalRef.current.w || session.naturalW,
      naturalRef.current.h || session.naturalH,
      1
    )?.minZoom ?? 0.5;
  const rotateDeg = adjust.rotate ?? 0;

  const tabs: { id: EditorTab; label: string }[] = isVideo
    ? [
        { id: "poster", label: "Обкладинка" },
        { id: "crop", label: "Кадр 3:5" },
        { id: "fine", label: "Тон" },
      ]
    : [
        { id: "crop", label: "Кадр 3:5" },
        { id: "fine", label: "Тон" },
      ];

  return createPortal(
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
        data-media-editor-fullscreen="1"
      >
        <header className="media-editor-head">
          <h2 id="media-editor-title" className="media-editor-title">
            <span>
              {isVideo ? "Відео · обкладинка й тон" : "Фото · кадр і тон"}
            </span>
            {queueTotal > 1 ? (
              <span className="media-editor-title-meta">
                {queueIndex} з {queueTotal}
              </span>
            ) : null}
            {fileLabel ? (
              <span className="media-editor-file-label" title={fileLabel}>
                {fileLabel}
              </span>
            ) : null}
          </h2>
          <div className="media-editor-head-actions">
            {showSkip ? (
              <button
                type="button"
                className="admin-btn-secondary media-editor-head-skip"
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
              className="admin-btn-primary media-editor-save media-editor-head-save"
              disabled={disabled}
              onClick={() => void handleSave()}
            >
              {saving
                ? "Збереження…"
                : isVideo
                  ? "Зберегти"
                  : session.replaceUrl
                    ? "Застосувати"
                    : "Додати в галерею"}
            </button>
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
          </div>
        </header>

        <div className="media-editor-body" data-scroll-lock-allow>
        <div
          className={`media-editor-layout${
            tab === "fine" ? " is-tone" : tab === "crop" ? " is-crop" : ""
          }`}
        >
          <div className="media-editor-preview-wrap">
            <div
              ref={frameRef}
              className={`media-editor-frame${
                showCropLayer && tab === "crop" ? " is-cropping" : ""
              }${tab === "fine" ? " is-tone-frame" : ""}`}
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
                  loop={false}
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    const w = v.videoWidth || session.naturalW;
                    const h = v.videoHeight || session.naturalH;
                    naturalRef.current = { w, h };
                    setVideoDuration(
                      Number.isFinite(v.duration) && v.duration > 0
                        ? v.duration
                        : 0
                    );
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
                          layout.maxX
                        ),
                        y: clamp(
                          spanY < 1 ? panRef.current.y : -(saved.y / 100) * spanY,
                          layout.minY,
                          layout.maxY
                        ),
                      };
                      applyPanToDom();
                    }
                    const start =
                      Number.isFinite(v.duration) && v.duration > 0.4
                        ? Math.min(0.35, v.duration * 0.08)
                        : 0.15;
                    try {
                      v.currentTime = start;
                      setVideoTime(start);
                    } catch {
                      /* keep first frame */
                    }
                    v.pause();
                  }}
                  onTimeUpdate={(e) => {
                    if (tab !== "poster") {
                      setVideoTime(e.currentTarget.currentTime);
                    }
                  }}
                  onError={() =>
                    setSaveError(
                      "Не вдалося відкрити відео для прев’ю. Оновіть сторінку або завантажте знову."
                    )
                  }
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
                  onLoad={() => {
                    const saved = session.initialAdjust?.frame;
                    if (saved?.zoom && saved.zoom > 1.001) {
                      setZoomAround(
                        saved.zoom,
                        session.naturalW,
                        session.naturalH
                      );
                    } else {
                      centerPan(session.naturalW, session.naturalH);
                    }
                  }}
                />
              )}
              <div className="media-editor-frame-guide" aria-hidden="true" />
              <span className="media-editor-frame-ratio">3 : 5</span>
            </div>

            {tab === "fine" ? (
              <div className="media-editor-tone-dock" data-scroll-lock-allow>
                <div className="media-editor-tone-dock-top">
                  <nav
                    className="media-editor-tabs media-editor-tabs--tone"
                    aria-label="Режим"
                  >
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
                  <div className="media-editor-tone-tools">
                    {isVideo ? (
                      <button
                        type="button"
                        className={`media-editor-chip${
                          videoPlaying ? " is-active" : ""
                        }`}
                        onClick={() => setVideoPlaying((p) => !p)}
                      >
                        {videoPlaying ? "Пауза" : "Грати"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`media-editor-chip${
                          compare ? " is-active" : ""
                        }`}
                        onPointerDown={() => setCompare(true)}
                        onPointerUp={() => setCompare(false)}
                        onPointerLeave={() => setCompare(false)}
                        onPointerCancel={() => setCompare(false)}
                      >
                        До / після
                      </button>
                    )}
                    <button
                      type="button"
                      className="media-editor-chip"
                      onClick={() =>
                        setAdjust((prev) => {
                          const frame = prev.frame ?? currentFrame();
                          const next: MediaAdjust = {
                            ...DEFAULT_MEDIA_ADJUST,
                          };
                          if (frame) next.frame = frame;
                          return next;
                        })
                      }
                    >
                      Скинути
                    </button>
                  </div>
                </div>
                {(() => {
                  const active =
                    TONE_TOOLS.find((t) => t.key === toneTool) ?? TONE_TOOLS[0];
                  const value = adjust[active.key] ?? 0;
                  const display =
                    active.key === "rotate"
                      ? `${Number(value).toFixed(1)}°`
                      : String(value);
                  return (
                    <div className="media-editor-tone-active">
                      <div className="media-editor-tone-active-top">
                        <span className="media-editor-tone-active-label">
                          {active.label}
                        </span>
                        <button
                          type="button"
                          className="media-editor-tone-active-value"
                          title="Скинути цей параметр"
                          onClick={() => onFineChange(active.key, 0)}
                        >
                          {display}
                        </button>
                      </div>
                      <input
                        type="range"
                        min={active.min}
                        max={active.max}
                        step={active.step}
                        value={value}
                        className="media-editor-range media-editor-range--ig"
                        aria-label={active.label}
                        onChange={(e) =>
                          onFineChange(active.key, Number(e.target.value))
                        }
                      />
                    </div>
                  );
                })()}
                <div
                  className="media-editor-tone-rail"
                  role="tablist"
                  aria-label="Параметри тону"
                >
                  {TONE_TOOLS.map((tool) => {
                    const active = toneTool === tool.key;
                    const dirty =
                      Math.abs(adjust[tool.key] ?? 0) >
                      (tool.key === "rotate" ? 0.05 : 0.5);
                    return (
                      <button
                        key={tool.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`media-editor-tone-tool${
                          active ? " is-active" : ""
                        }${dirty ? " is-dirty" : ""}`}
                        onClick={() => setToneTool(tool.key)}
                      >
                        <span className="media-editor-tone-tool-label">
                          {tool.label}
                        </span>
                        {dirty ? (
                          <span className="media-editor-tone-tool-dot" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="media-editor-preview-actions">
              {isVideo && tab === "poster" ? (
                <button
                  type="button"
                  className="media-editor-chip is-active"
                  disabled={disabled || posterBusy}
                  onClick={() => void pickPosterFromCurrentFrame()}
                >
                  {posterBusy ? "Знімаю…" : "Взяти цей кадр"}
                </button>
              ) : tab === "crop" ? (
                <div className="media-editor-zoom-bar">
                  <button
                    type="button"
                    className="media-editor-zoom-btn"
                    aria-label="Віддалити"
                    disabled={disabled || zoom <= liveMinZoom + 0.001}
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
                    min={liveMinZoom}
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
              ) : null}
            </div>
          </div>

          <div className={`media-editor-side${tab === "fine" ? " is-hidden-tone" : ""}`}>
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
              {tab === "poster" && isVideo ? (
                <div className="media-editor-crop-help media-editor-poster-help">
                  <p className="media-editor-hint">
                    Обкладинка видно в мініатюрах і до запуску відео. Прокрутіть
                    таймлайн і натисніть «Взяти цей кадр», якщо перший кадр
                    поганий.
                  </p>
                  <label className="media-editor-slider">
                    <div className="media-editor-slider-top">
                      <span className="media-editor-slider-label">Кадр</span>
                      <span className="media-editor-slider-value">
                        {videoDuration > 0
                          ? `${videoTime.toFixed(1)} / ${videoDuration.toFixed(1)} с`
                          : "—"}
                      </span>
                    </div>
                    <span className="media-editor-slider-hint">
                      Тягніть, щоб знайти вдалий момент
                    </span>
                    <input
                      type="range"
                      className="media-editor-range"
                      min={0}
                      max={Math.max(videoDuration || 1, 0.1)}
                      step={0.05}
                      value={Math.min(videoTime, videoDuration || 0)}
                      disabled={disabled || videoDuration <= 0}
                      onChange={(e) =>
                        void scrubVideoTo(Number(e.target.value))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="admin-btn-secondary media-editor-poster-pick"
                    disabled={disabled || posterBusy}
                    onClick={() => void pickPosterFromCurrentFrame()}
                  >
                    {posterBusy ? "Знімаю кадр…" : "Взяти цей кадр як обкладинку"}
                  </button>
                  {posterPreview ? (
                    <div className="media-editor-poster-preview">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={posterPreview} alt="" draggable={false} />
                      <p className="media-editor-hint" style={{ margin: 0 }}>
                        Обрана обкладинка
                      </p>
                      <button
                        type="button"
                        className="media-editor-reset"
                        disabled={disabled}
                        onClick={() => {
                          if (posterObjectUrlRef.current) {
                            URL.revokeObjectURL(posterObjectUrlRef.current);
                            posterObjectUrlRef.current = null;
                          }
                          setPosterFile(null);
                          setPosterPreview(null);
                          setPosterCleared(true);
                        }}
                      >
                        Прибрати обкладинку
                      </button>
                    </div>
                  ) : (
                    <p className="media-editor-hint">
                      Поки без обкладинки — на сайті покажеться ранній кадр
                      відео.
                    </p>
                  )}
                </div>
              ) : null}

              {tab === "crop" && (
                <div className="media-editor-crop-help">
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
                        min={liveMinZoom}
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

        <footer className="media-editor-foot media-editor-foot--secondary">
          <button
            type="button"
            className="admin-btn-ghost media-editor-cancel"
            disabled={disabled}
            onClick={onClose}
          >
            Скасувати
          </button>
        </footer>
        </div>
      </div>
    </div>,
    document.body
  );
}
