"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  isImageUploadFile,
  prepareImageUploadFile,
} from "@/lib/prepareUploadImage";
import type { ProductMedia } from "@/lib/types";

type Props = {
  media: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
};

type CropSource = {
  /** Key in media list (url) being replaced; null = new file not yet in list */
  replaceUrl: string | null;
  file: File;
  objectUrl: string;
  naturalW: number;
  naturalH: number;
};

type PanState = { x: number; y: number };

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function ProductMediaManager({ media, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cropping, setCropping] = useState(false);
  const [cropSource, setCropSource] = useState<CropSource | null>(null);

  const mediaRef = useRef(media);
  mediaRef.current = media;

  /** Keep original Files so we can re-crop after batch upload. */
  const originalsRef = useRef<Map<string, File>>(new Map());

  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const panRef = useRef<PanState>({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const rafRef = useRef(0);

  const dragItemRef = useRef<number | null>(null);
  /** Images waiting for crop after multi-select */
  const cropQueueRef = useRef<File[]>([]);
  const [cropQueueTotal, setCropQueueTotal] = useState(0);
  const [cropQueueIndex, setCropQueueIndex] = useState(0);

  useEffect(() => {
    return () => {
      if (cropSource?.objectUrl) URL.revokeObjectURL(cropSource.objectUrl);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cropSource]);

  useScrollLock(Boolean(cropSource));

  const applyPanToDom = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transform = `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0)`;
  }, []);

  const coverLayout = useCallback((naturalW: number, naturalH: number) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const frameW = frame.clientWidth;
    const frameH = frame.clientHeight;
    if (frameW <= 0 || frameH <= 0) return null;
    const scale = Math.max(frameW / naturalW, frameH / naturalH);
    const dispW = naturalW * scale;
    const dispH = naturalH * scale;
    const minX = frameW - dispW;
    const minY = frameH - dispH;
    return { frameW, frameH, scale, dispW, dispH, minX, minY };
  }, []);

  const centerPan = useCallback(
    (naturalW: number, naturalH: number) => {
      const layout = coverLayout(naturalW, naturalH);
      if (!layout) {
        panRef.current = { x: 0, y: 0 };
        return;
      }
      panRef.current = {
        x: (layout.frameW - layout.dispW) / 2,
        y: (layout.frameH - layout.dispH) / 2,
      };
      applyPanToDom();
      const img = imgRef.current;
      if (img) {
        img.style.width = `${layout.dispW}px`;
        img.style.height = `${layout.dispH}px`;
      }
    },
    [applyPanToDom, coverLayout]
  );

  const openCrop = useCallback(
    async (file: File, replaceUrl: string | null) => {
      const objectUrl = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("img"));
          img.src = objectUrl;
        });
        setCropSource({
          file,
          objectUrl,
          replaceUrl,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
        });
        // Center after paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            centerPan(img.naturalWidth, img.naturalHeight);
          });
        });
      } catch {
        URL.revokeObjectURL(objectUrl);
        setError("Не вдалося відкрити зображення для кадрування");
      }
    },
    [centerPan]
  );

  const closeCrop = useCallback(() => {
    if (cropSource?.objectUrl) URL.revokeObjectURL(cropSource.objectUrl);
    setCropSource(null);
    dragRef.current = null;
  }, [cropSource]);

  const uploadOne = useCallback(
    async (
      file: File,
      crop?: { x: number; y: number; w: number; h: number }
    ): Promise<ProductMedia[]> => {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("fit", "catalog");
      if (crop) fd.append("crop", JSON.stringify(crop));
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        throw new Error(
          body.message || body.error || `HTTP ${res.status}`
        );
      }
      const data = (await res.json()) as {
        items?: ProductMedia[];
        urls?: string[];
      };
      return (
        data.items?.map((i) => ({
          url: i.url,
          type: i.type === "video" ? ("video" as const) : ("image" as const),
          width: i.width,
          height: i.height,
        })) ??
        (data.urls || []).map((url) => ({ url, type: "image" as const }))
      );
    },
    []
  );

  const advanceCropQueue = useCallback(async () => {
    const next = cropQueueRef.current.shift();
    if (next) {
      setCropQueueIndex((i) => i + 1);
      await openCrop(next, null);
      return;
    }
    setUploading(false);
    setUploadProgress(null);
    setCropQueueTotal(0);
    setCropQueueIndex(0);
  }, [openCrop]);

  const abortCropQueue = useCallback(() => {
    cropQueueRef.current = [];
    setCropQueueTotal(0);
    setCropQueueIndex(0);
    setUploading(false);
    setUploadProgress(null);
  }, []);

  const skipCropAndContinue = useCallback(() => {
    closeCrop();
    void advanceCropQueue();
  }, [closeCrop, advanceCropQueue]);

  const cancelCropSession = useCallback(() => {
    closeCrop();
    abortCropQueue();
  }, [closeCrop, abortCropQueue]);

  /** Videos upload immediately; images open crop (3:5) one by one. */
  const onPickFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const videos = list.filter((f) => f.type.startsWith("video/"));
    const rawImages = list.filter((f) => isImageUploadFile(f));
    if (!videos.length && !rawImages.length) {
      setError("Оберіть зображення (JPEG, PNG, HEIC) або відео");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < videos.length; i++) {
        const file = videos[i];
        setUploadProgress(`Відео ${i + 1} / ${videos.length}`);
        const items = await uploadOne(file);
        if (!items.length) throw new Error("empty");
        const next = [...mediaRef.current, ...items];
        mediaRef.current = next;
        onChange(next);
      }

      const images: File[] = [];
      for (const f of rawImages) {
        try {
          images.push(await prepareImageUploadFile(f));
        } catch (e) {
          console.error(e);
          setError(
            `Не вдалося відкрити «${f.name}». Спробуйте зберегти як JPEG.`
          );
        }
      }

      if (!images.length) {
        setUploading(false);
        setUploadProgress(null);
        return;
      }

      cropQueueRef.current = images.slice(1);
      setCropQueueTotal(images.length);
      setCropQueueIndex(1);
      setUploadProgress(`Кадр 1 / ${images.length}`);
      await openCrop(images[0], null);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "upload_failed";
      setError(
        msg.includes("unsupported") || msg.includes("HEIC")
          ? msg
          : "Не вдалося завантажити частину файлів"
      );
      abortCropQueue();
    }
  };

  const confirmCrop = async () => {
    if (!cropSource) return;
    const layout = coverLayout(cropSource.naturalW, cropSource.naturalH);
    if (!layout) return;

    const { naturalW, naturalH, file, replaceUrl } = cropSource;
    const { scale, dispW, dispH, frameW, frameH } = layout;
    const { x: panX, y: panY } = panRef.current;

    // Visible frame in source-image coordinates
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

    // Ensure crop stays inside image
    if (crop.x + crop.w > 1) crop.x = Math.max(0, 1 - crop.w);
    if (crop.y + crop.h > 1) crop.y = Math.max(0, 1 - crop.h);

    void dispW;
    void dispH;

    setCropping(true);
    setError(null);
    try {
      const items = await uploadOne(file, crop);
      const fresh = items[0];
      if (!fresh) throw new Error("empty");

      if (replaceUrl) {
        originalsRef.current.delete(replaceUrl);
        originalsRef.current.set(fresh.url, file);
        const next = mediaRef.current.map((m) =>
          m.url === replaceUrl ? fresh : m
        );
        mediaRef.current = next;
        onChange(next);
      } else {
        originalsRef.current.set(fresh.url, file);
        const next = [...mediaRef.current, fresh];
        mediaRef.current = next;
        onChange(next);
      }
      closeCrop();
      if (!replaceUrl) {
        if (cropQueueRef.current.length > 0) {
          setUploadProgress(
            `Кадр ${cropQueueIndex + 1} / ${cropQueueTotal}`
          );
          await advanceCropQueue();
        } else {
          abortCropQueue();
        }
      }
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Не вдалося зберегти кадр"
      );
    } finally {
      setCropping(false);
    }
  };

  const removeAt = (idx: number) => {
    const target = mediaRef.current[idx];
    if (target) originalsRef.current.delete(target.url);
    const next = mediaRef.current.filter((_, i) => i !== idx);
    mediaRef.current = next;
    onChange(next);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= mediaRef.current.length) return;
    const next = [...mediaRef.current];
    [next[idx], next[t]] = [next[t], next[idx]];
    mediaRef.current = next;
    onChange(next);
  };

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    if (from >= mediaRef.current.length || to >= mediaRef.current.length) return;
    const next = [...mediaRef.current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    mediaRef.current = next;
    onChange(next);
  };

  const startCropFor = async (idx: number) => {
    const item = mediaRef.current[idx];
    if (!item || item.type === "video") return;
    const original = originalsRef.current.get(item.url);
    if (original) {
      await openCrop(original, item.url);
      return;
    }
    // Fallback: fetch current image (already processed) for fine adjust
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error("fetch");
      const blob = await res.blob();
      const file = new File([blob], "crop-source.webp", {
        type: blob.type || "image/webp",
      });
      await openCrop(file, item.url);
    } catch (e) {
      console.error(e);
      setError("Не вдалося відкрити фото для кадрування");
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!cropSource) return;
    e.preventDefault();
    const el = frameRef.current;
    el?.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: panRef.current.x,
      originY: panRef.current.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !cropSource) return;
    e.preventDefault();

    const layout = coverLayout(cropSource.naturalW, cropSource.naturalH);
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
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            Фото та відео
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Оберіть кілька файлів — для кожного відкриється кадрування 3:5,
            потім сітка з можливістю змінити порядок.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={uploading || Boolean(cropSource)}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? uploadProgress
              ? `Завантаження ${uploadProgress}`
              : "Обробка…"
            : "Додати медіа"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/heic,image/heif,video/mp4,video/webm"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onPickFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((m, idx) => (
          <div
            key={`${m.url}-${idx}`}
            draggable
            onDragStart={() => {
              dragItemRef.current = idx;
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragItemRef.current;
              dragItemRef.current = null;
              if (from == null) return;
              reorder(from, idx);
            }}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]"
          >
            <div className="relative aspect-[3/5] bg-gray-100 dark:bg-gray-800">
              {m.type === "video" ? (
                <video
                  src={m.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.dataset.retried === "1") return;
                    el.dataset.retried = "1";
                    const base = m.url.split("?")[0];
                    window.setTimeout(() => {
                      el.src = `${base}?t=${Date.now()}`;
                    }, 400);
                  }}
                />
              )}
              {idx === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-[#B7E1DF] px-2 py-0.5 text-[10px] font-semibold text-[#111]">
                  Головне
                </span>
              )}
              <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                {m.type === "video" ? "VIDEO" : "3:5"}
                {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 p-2">
              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="admin-btn-ghost !min-h-9 !min-w-9 !px-2"
                    disabled={idx === 0}
                    aria-label="Ліворуч"
                    onClick={() => move(idx, -1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="admin-btn-ghost !min-h-9 !min-w-9 !px-2"
                    disabled={idx === media.length - 1}
                    aria-label="Праворуч"
                    onClick={() => move(idx, 1)}
                  >
                    →
                  </button>
                </div>
                <button
                  type="button"
                  className="admin-btn-ghost text-red-600 dark:text-red-400"
                  onClick={() => removeAt(idx)}
                >
                  Видалити
                </button>
              </div>
              {m.type !== "video" && (
                <button
                  type="button"
                  className="admin-btn-secondary !h-9 w-full !text-xs"
                  disabled={uploading || Boolean(cropSource)}
                  onClick={() => void startCropFor(idx)}
                >
                  Кадрувати
                </button>
              )}
            </div>
          </div>
        ))}

        {!media.length && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[3/5] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 transition hover:border-gray-500 hover:text-gray-600 dark:border-gray-600"
          >
            + Додати кілька
          </button>
        )}
      </div>

      {cropSource && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/55 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            data-scroll-lock-allow
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Кадр як у каталозі (3:5)
              {cropQueueTotal > 1 ? (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {cropQueueIndex} / {cropQueueTotal}
                </span>
              ) : null}
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              Посуньте фото, щоб обрати кадр. Після «Зберегти кадр» відкриється
              наступне фото, якщо ви обрали кілька.
            </p>
            <div
              ref={frameRef}
              className="relative mx-auto mt-4 aspect-[3/5] w-full max-w-[300px] touch-none overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
              style={{ cursor: "grab", touchAction: "none" }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={cropSource.objectUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none will-change-transform"
                onLoad={() => {
                  centerPan(cropSource.naturalW, cropSource.naturalH);
                }}
              />
              <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#B7E1DF]" />
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="admin-btn-ghost !text-xs"
                disabled={cropping}
                onClick={cancelCropSession}
              >
                Зупинити
              </button>
              {cropQueueTotal > 1 ? (
                <button
                  type="button"
                  className="admin-btn-secondary !text-xs"
                  disabled={cropping}
                  onClick={skipCropAndContinue}
                >
                  Пропустити фото
                </button>
              ) : null}
              <button
                type="button"
                className="admin-btn-primary"
                disabled={cropping}
                onClick={() => void confirmCrop()}
              >
                {cropping ? "Збереження…" : "Зберегти кадр"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
