"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import AdminUploadPreloader from "@/components/admin/AdminUploadPreloader";
import MediaEditModal, {
  type MediaEditSession,
  type VideoPosterSave,
} from "@/components/admin/MediaEditModal";
import { mediaAdjustProps } from "@/components/shared/MediaWithAdjust";
import AdminVideoThumb from "@/components/admin/AdminVideoThumb";
import {
  captureVideoPoster,
  captureVideoPosterFromUrl,
} from "@/lib/captureVideoPoster";
import {
  isDefaultAdjust,
  type MediaAdjust,
} from "@/lib/mediaAdjust";
import { classifyUploadFile } from "@/lib/mediaUploadKind";
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
  const [videoPosters, setVideoPosters] = useState<Record<string, string>>({});
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const inputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<number | null>(null);

  const imageQueueRef = useRef<PendingImage[]>([]);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueIndex, setQueueIndex] = useState(0);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  const posterRequestedRef = useRef(new Set<string>());

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
      urls.clear();
    };
  }, []);

  useEffect(() => {
    for (const m of media) {
      if (m.type !== "video") continue;
      if (m.poster) {
        setVideoPosters((prev) =>
          prev[m.url] === m.poster ? prev : { ...prev, [m.url]: m.poster! }
        );
        posterRequestedRef.current.add(m.url);
        continue;
      }
      if (posterRequestedRef.current.has(m.url)) continue;
      posterRequestedRef.current.add(m.url);
      void captureVideoPosterFromUrl(m.url)
        .then((poster) => {
          setVideoPosters((prev) =>
            prev[m.url] ? prev : { ...prev, [m.url]: poster }
          );
        })
        .catch(() => undefined);
    }
  }, [media]);

  const trackObjectUrl = (url: string) => {
    objectUrlsRef.current.add(url);
    return url;
  };

  const uploadOne = useCallback(
    async (
      file: File,
      opts?: { ready?: boolean; video?: boolean }
    ): Promise<ProductMedia[]> => {
    const fd = new FormData();
    fd.append("images", file);
    if (opts?.video) {
      fd.append("kind", "video");
    } else {
      fd.append("fit", "catalog");
    }
    if (opts?.ready) fd.append("ready", "1");
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
  },
  []
  );

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
    (
      url: string,
      file: File | null,
      initialAdjust?: MediaAdjust,
      naturalW = 1080,
      naturalH = 1920,
      initialPoster?: string | null
    ) => {
      const previewUrl = file
        ? trackObjectUrl(URL.createObjectURL(file))
        : url;
      setEditSession({
        mode: "video",
        file,
        previewUrl,
        replaceUrl: url,
        naturalW,
        naturalH,
        initialAdjust,
        initialPoster: initialPoster ?? null,
        label: file?.name ?? url.split("/").pop()?.split("?")[0],
      });
    },
    []
  );

  const loadVideoDimensions = (src: string): Promise<{ w: number; h: number }> =>
    new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.src = `${src.split("#")[0]}#t=0.1`;
      video.onloadedmetadata = () => {
        resolve({
          w: video.videoWidth || 1080,
          h: video.videoHeight || 1920,
        });
      };
      video.onerror = () => reject(new Error("video_meta"));
    });

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
    const kinds = await Promise.all(
      list.map(async (f) => ({
        f,
        kind: (await classifyUploadFile(f)) as "video" | "image",
      }))
    );
    const videos = kinds.filter((x) => x.kind === "video").map((x) => x.f);
    const rawImages = kinds.filter((x) => x.kind === "image").map((x) => x.f);
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
        setUploadProgress(
          videos.length > 1
            ? `Завантаження відео ${i + 1} з ${videos.length}…`
            : "Завантаження відео…"
        );
        const items = await uploadOne(file, { video: true });
        const fresh = items[0];
        if (!fresh) throw new Error("empty");
        originalsRef.current.set(fresh.url, file);
        queueMicrotask(() => {
          void captureVideoPosterFromUrl(fresh.url)
            .catch(() => captureVideoPoster(file))
            .then((poster) => {
              if (!poster) return;
              setVideoPosters((prev) => ({ ...prev, [fresh.url]: poster }));
            })
            .catch(() => undefined);
        });
        const next = [...mediaRef.current, fresh];
        mediaRef.current = next;
        onChange(next);
        videoCount += 1;
      }

      const images: File[] = [];
      if (rawImages.length) {
        setUploadProgress(
          rawImages.length > 1
            ? `Підготовка фото (0 / ${rawImages.length})…`
            : "Підготовка фото…"
        );
      }
      for (let i = 0; i < rawImages.length; i++) {
        const f = rawImages[i];
        if (rawImages.length > 1) {
          setUploadProgress(
            `Підготовка фото ${i + 1} з ${rawImages.length}…`
          );
        }
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
        if (videoCount > 0) {
          setUploadNotice(
            videoCount === 1
              ? "Відео додано. Кадр — кнопка «Кадр»."
              : `Додано ${videoCount} відео. Кадр — кнопка «Кадр» на картці.`
          );
        }
        return;
      }

      // Upload straight into the gallery — crop/tone stays optional via «Кадр».
      let uploaded = 0;
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        setUploadProgress(
          images.length > 1
            ? `Завантаження фото ${i + 1} з ${images.length}…`
            : "Завантаження фото…"
        );
        const items = await uploadOne(file);
        const fresh = items[0];
        if (!fresh) throw new Error("empty");
        originalsRef.current.set(fresh.url, file);
        const next = [...mediaRef.current, fresh];
        mediaRef.current = next;
        onChange(next);
        uploaded += 1;
      }

      const parts: string[] = [];
      if (videoCount > 0) {
        parts.push(
          videoCount === 1 ? "відео додано" : `${videoCount} відео додано`
        );
      }
      parts.push(
        uploaded === 1 ? "фото в галереї" : `${uploaded} фото в галереї`
      );
      setUploadNotice(
        `${parts.join(" · ")}. Кадр і тон — кнопка «Кадр» на картці.`
      );
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Не вдалося завантажити частину файлів"
      );
      abortQueues();
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
    setUploadProgress(
      queueTotal > 1
        ? `Збереження фото ${queueIndex} з ${queueTotal}…`
        : "Збереження фото…"
    );
    setError(null);
    try {
      const items = await uploadOne(file, { ready: true });
      const fresh = items[0];
      if (!fresh) throw new Error("empty");
      const source = replaceUrl
        ? originalsRef.current.get(replaceUrl) ?? editSession?.file ?? file
        : editSession?.file ?? file;
      patchMedia(replaceUrl, fresh, source, adjust);
      closeEdit();
      if (imageQueueRef.current.length) {
        setUploadProgress(
          `Наступне фото ${queueIndex + 1} з ${queueTotal}…`
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
      setUploadProgress(null);
    }
  };

  const onSaveVideo = async (
    replaceUrl: string,
    adjust: MediaAdjust,
    poster: VideoPosterSave
  ) => {
    setUploading(true);
    setUploadProgress(
      poster.kind === "file" ? "Збереження обкладинки…" : "Збереження відео…"
    );
    setError(null);
    try {
      let posterUrl: string | undefined;
      if (poster.kind === "file") {
        const items = await uploadOne(poster.file, { ready: true });
        posterUrl = items[0]?.url;
        if (!posterUrl) throw new Error("poster_upload");
      } else if (poster.kind === "keep") {
        posterUrl = poster.url;
      }

      const next = mediaRef.current.map((m) => {
        if (m.url !== replaceUrl) return m;
        const base: ProductMedia = {
          ...m,
          ...(isDefaultAdjust(adjust)
            ? { adjust: undefined }
            : { adjust }),
        };
        if (posterUrl) base.poster = posterUrl;
        else delete base.poster;
        return base;
      });
      mediaRef.current = next;
      onChange(next);
      if (posterUrl) {
        setVideoPosters((prev) => ({ ...prev, [replaceUrl]: posterUrl! }));
      } else {
        setVideoPosters((prev) => {
          const copy = { ...prev };
          delete copy[replaceUrl];
          return copy;
        });
        posterRequestedRef.current.delete(replaceUrl);
      }
      closeEdit();
      if (imageQueueRef.current.length) {
        await advanceImageQueue();
      } else {
        abortQueues();
      }
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Не вдалося зберегти обкладинку відео"
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
      if (original) {
        openVideoEdit(
          item.url,
          original,
          item.adjust,
          1080,
          1920,
          item.poster
        );
        return;
      }
      try {
        const dims = await loadVideoDimensions(item.url);
        openVideoEdit(
          item.url,
          null,
          item.adjust,
          dims.w,
          dims.h,
          item.poster
        );
      } catch (e) {
        console.error(e);
        openVideoEdit(item.url, null, item.adjust, 1080, 1920, item.poster);
      }
      return;
    }
    const original = originalsRef.current.get(item.url);
    if (original) {
      await openImageEdit(original, item.url, item.adjust);
      return;
    }
    setUploading(true);
    setUploadProgress("Відкриваю фото для кадру…");
    try {
      const url = item.url.startsWith("http")
        ? item.url
        : new URL(item.url, window.location.origin).href;
      const res = await fetch(url, { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const blob = await res.blob();
      if (!blob.size) throw new Error("empty");
      const ext =
        blob.type.includes("png")
          ? "png"
          : blob.type.includes("jpeg") || blob.type.includes("jpg")
            ? "jpg"
            : "webp";
      const file = new File([blob], `edit-source.${ext}`, {
        type: blob.type || "image/webp",
      });
      originalsRef.current.set(item.url, file);
      await openImageEdit(file, item.url, item.adjust);
    } catch (e) {
      console.error(e);
      setError(
        "Не вдалося відкрити фото для кадру. Спробуйте ще раз або завантажте файл заново."
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      <AdminUploadPreloader
        open={uploading && !editSession}
        label={uploadProgress || "Завантаження…"}
      />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="hidden text-[13px] text-gray-500 sm:block">
          Фото — кадр 3:5. Відео — одразу в галерею.
        </p>
        <button
          type="button"
          className="admin-btn-secondary w-full sm:w-auto"
          disabled={uploading || Boolean(editSession)}
          onClick={() => inputRef.current?.click()}
        >
          Додати медіа
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
                <AdminVideoThumb
                  src={m.url}
                  adjust={m.adjust}
                  poster={m.poster || videoPosters[m.url] || null}
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
                {m.type === "video" ? "Кадр / обкладинка" : "Кадр і тон"}
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
