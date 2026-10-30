"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import MediaEditModal, {
  type MediaEditSession,
} from "@/components/admin/MediaEditModal";
import { mediaAdjustProps } from "@/components/shared/MediaWithAdjust";
import {
  isDefaultAdjust,
  type MediaAdjust,
} from "@/lib/mediaAdjust";
import { isVideoUploadFile } from "@/lib/mediaUploadKind";
import {
  prepareImageUploadFile,
} from "@/lib/prepareUploadImage";
import type { ProductMedia } from "@/lib/types";

type Props = {
  media: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
};

type PendingImage = { file: File; replaceUrl: string | null };

export default function ProductMediaManager({ media, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editSession, setEditSession] = useState<MediaEditSession | null>(
    null
  );

  const mediaRef = useRef(media);
  mediaRef.current = media;

  const originalsRef = useRef<Map<string, File>>(new Map());
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<number | null>(null);

  const imageQueueRef = useRef<PendingImage[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueIndex, setQueueIndex] = useState(0);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      for (const u of objectUrlsRef.current) URL.revokeObjectURL(u);
      objectUrlsRef.current.clear();
    };
  }, []);

  const trackObjectUrl = (url: string) => {
    objectUrlsRef.current.add(url);
    return url;
  };

  const uploadOne = useCallback(async (file: File): Promise<ProductMedia[]> => {
    const fd = new FormData();
    fd.append("images", file);
    fd.append("fit", "catalog");
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
      throw new Error(body.message || body.error || `HTTP ${res.status}`);
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
  }, []);

  const openImageEdit = useCallback(
    async (file: File, replaceUrl: string | null, initialAdjust?: MediaAdjust) => {
      const objectUrl = trackObjectUrl(URL.createObjectURL(file));
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("img"));
          img.src = objectUrl;
        });
        setEditSession({
          mode: "image",
          file,
          previewUrl: objectUrl,
          replaceUrl,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          initialAdjust,
        });
      } catch {
        URL.revokeObjectURL(objectUrl);
        objectUrlsRef.current.delete(objectUrl);
        setError("Не вдалося відкрити зображення");
      }
    },
    []
  );

  const openVideoEdit = useCallback(
    async (url: string, file: File | null, initialAdjust?: MediaAdjust) => {
      const previewUrl = file
        ? trackObjectUrl(URL.createObjectURL(file))
        : url;
      let naturalW = 1080;
      let naturalH = 1920;
      try {
        const probe = document.createElement("video");
        probe.preload = "metadata";
        probe.src = previewUrl;
        await new Promise<void>((resolve, reject) => {
          probe.onloadedmetadata = () => resolve();
          probe.onerror = () => reject(new Error("meta"));
        });
        if (probe.videoWidth > 0 && probe.videoHeight > 0) {
          naturalW = probe.videoWidth;
          naturalH = probe.videoHeight;
        }
      } catch {
        /* keep defaults */
      }
      setEditSession({
        mode: "video",
        file,
        previewUrl,
        replaceUrl: url,
        naturalW,
        naturalH,
        initialAdjust,
        label: file?.name ?? url.split("/").pop()?.split("?")[0],
      });
    },
    []
  );

  const closeEdit = useCallback(() => {
    setEditSession(null);
  }, []);

  const abortQueues = useCallback(() => {
    imageQueueRef.current = [];
    setQueueTotal(0);
    setQueueIndex(0);
    setUploading(false);
    setUploadProgress(null);
  }, []);

  const advanceImageQueue = useCallback(async () => {
    const next = imageQueueRef.current.shift();
    if (next) {
      setQueueIndex((i) => i + 1);
      await openImageEdit(next.file, next.replaceUrl);
      return;
    }
    abortQueues();
    closeEdit();
  }, [abortQueues, closeEdit, openImageEdit]);

  const skipEdit = useCallback(() => {
    closeEdit();
    void advanceImageQueue();
  }, [advanceImageQueue, closeEdit]);

  const cancelAll = useCallback(() => {
    closeEdit();
    abortQueues();
  }, [abortQueues, closeEdit]);

  const onPickFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const videos = list.filter((f) => isVideoUploadFile(f));
    const rawImages = list.filter((f) => !isVideoUploadFile(f));
    if (!videos.length && !rawImages.length) {
      setError("Не вдалося прочитати файли");
      return;
    }

    setUploading(true);
    setError(null);
    setUploadNotice(null);

    try {
      let videoCount = 0;
      for (let i = 0; i < videos.length; i++) {
        const file = videos[i];
        setUploadProgress(`Завантаження відео ${i + 1} / ${videos.length}…`);
        const items = await uploadOne(file);
        const fresh = items[0];
        if (!fresh) throw new Error("empty");
        originalsRef.current.set(fresh.url, file);
        const next = [...mediaRef.current, fresh];
        mediaRef.current = next;
        onChange(next);
        videoCount += 1;
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

      if (images.length === 0) {
        abortQueues();
        if (videoCount > 0) {
          setUploadNotice(
            videoCount === 1
              ? "Відео додано. Тон — кнопка «Тон відео», якщо потрібно."
              : `Додано ${videoCount} відео. Тон — «Тон відео» на кожній картці.`
          );
        }
        return;
      }

      imageQueueRef.current = images.slice(1).map((file) => ({
        file,
        replaceUrl: null,
      }));
      setQueueTotal(images.length);
      setQueueIndex(1);
      setUploadProgress(`Кадр фото 1 / ${images.length}`);
      if (videoCount > 0) {
        setUploadNotice(
          `Відео (${videoCount}) уже в галереї — відкриється лише кадрування фото.`
        );
      }
      await openImageEdit(images[0], null);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити частину файлів");
      abortQueues();
    }
  };

  const patchMedia = (
    replaceUrl: string | null,
    fresh: ProductMedia,
    sourceFile: File | null,
    adjust: MediaAdjust
  ) => {
    const withAdjust = isDefaultAdjust(adjust)
      ? fresh
      : { ...fresh, adjust };
    if (sourceFile) {
      if (replaceUrl) originalsRef.current.delete(replaceUrl);
      originalsRef.current.set(fresh.url, sourceFile);
    }
    if (replaceUrl) {
      const next = mediaRef.current.map((m) =>
        m.url === replaceUrl ? withAdjust : m
      );
      mediaRef.current = next;
      onChange(next);
    } else {
      const next = [...mediaRef.current, withAdjust];
      mediaRef.current = next;
      onChange(next);
    }
  };

  const onSaveImage = async (
    file: File,
    replaceUrl: string | null,
    adjust: MediaAdjust
  ) => {
    setUploading(true);
    setError(null);
    try {
      const items = await uploadOne(file);
      const fresh = items[0];
      if (!fresh) throw new Error("empty");
      const source = replaceUrl
        ? originalsRef.current.get(replaceUrl) ?? editSession?.file ?? file
        : editSession?.file ?? file;
      patchMedia(replaceUrl, fresh, source, adjust);
      closeEdit();
      if (imageQueueRef.current.length) {
        setUploadProgress(
          `Кадр фото ${queueIndex + 1} / ${queueTotal}`
        );
        await advanceImageQueue();
      } else {
        abortQueues();
      }
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Не вдалося зберегти фото"
      );
    } finally {
      setUploading(false);
    }
  };

  const onSaveVideo = async (replaceUrl: string, adjust: MediaAdjust) => {
    const next = mediaRef.current.map((m) =>
      m.url === replaceUrl
        ? isDefaultAdjust(adjust)
          ? { ...m, adjust: undefined }
          : { ...m, adjust }
        : m
    );
    mediaRef.current = next;
    onChange(next);
    closeEdit();
    if (imageQueueRef.current.length) {
      await advanceImageQueue();
    } else {
      abortQueues();
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

  const startEditFor = async (idx: number) => {
    const item = mediaRef.current[idx];
    if (!item) return;
    setError(null);
    if (item.type === "video") {
      const original = originalsRef.current.get(item.url);
      await openVideoEdit(item.url, original ?? null, item.adjust);
      return;
    }
    const original = originalsRef.current.get(item.url);
    if (original) {
      await openImageEdit(original, item.url, item.adjust);
      return;
    }
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error("fetch");
      const blob = await res.blob();
      const file = new File([blob], "edit-source.webp", {
        type: blob.type || "image/webp",
      });
      await openImageEdit(file, item.url, item.adjust);
    } catch (e) {
      console.error(e);
      setError("Не вдалося відкрити медіа для редагування");
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
            Фото після завантаження відкривають кадр 3:5. Відео одразу потрапляє
            в галерею — тон за потреби через «Тон відео». Старі файли — «Редагувати»
            / «Тон відео».
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={uploading || Boolean(editSession)}
          onClick={() => inputRef.current?.click()}
        >
          {uploading
            ? uploadProgress
              ? uploadProgress
              : "Обробка…"
            : "Додати медіа"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
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
      {uploadNotice && !error ? (
        <p className="text-sm text-teal-800 dark:text-teal-200/90">{uploadNotice}</p>
      ) : null}

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
                  style={mediaAdjustProps(m.adjust).style}
                  muted
                  playsInline
                  preload="metadata"
                  controls
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt=""
                  className="h-full w-full object-cover"
                  style={mediaAdjustProps(m.adjust).style}
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
              {m.adjust && !isDefaultAdjust(m.adjust) && (
                <span className="absolute right-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white">
                  Тон
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
              <button
                type="button"
                className="admin-btn-secondary !h-9 w-full !text-xs"
                disabled={uploading || Boolean(editSession)}
                onClick={() => void startEditFor(idx)}
              >
                {m.type === "video" ? "Тон відео" : "Редагувати"}
              </button>
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

      <MediaEditModal
        session={editSession}
        queueIndex={queueIndex}
        queueTotal={queueTotal}
        busy={uploading}
        onClose={cancelAll}
        onSkip={skipEdit}
        onSaveImage={onSaveImage}
        onSaveVideo={onSaveVideo}
      />
    </div>
  );
}
