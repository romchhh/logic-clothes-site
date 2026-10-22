"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ProductMedia } from "@/lib/types";

/** Instagram post portrait 4:5 */
const RATIO = 4 / 5;

type Props = {
  media: ProductMedia[];
  onChange: (media: ProductMedia[]) => void;
};

type PendingCrop = {
  file: File;
  objectUrl: string;
  naturalW: number;
  naturalH: number;
};

export default function ProductMediaManager({ media, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingCrop | null>(null);
  const [offset, setOffset] = useState({ x: 0.5, y: 0.5 }); // focus point 0–1
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (pending?.objectUrl) URL.revokeObjectURL(pending.objectUrl);
    };
  }, [pending]);

  const uploadProcessed = useCallback(
    async (file: File, crop?: { x: number; y: number; w: number; h: number }) => {
      setUploading(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("images", file);
        fd.append("fit", "instagram");
        if (crop) fd.append("crop", JSON.stringify(crop));
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          items?: ProductMedia[];
          urls?: string[];
        };
        const items: ProductMedia[] =
          data.items?.map((i) => ({
            url: i.url,
            type: i.type === "video" ? "video" : "image",
            width: i.width,
            height: i.height,
          })) ??
          (data.urls || []).map((url) => ({ url, type: "image" as const }));
        if (!items.length) throw new Error("empty");
        onChange([...media, ...items]);
      } catch (e) {
        console.error(e);
        setError("Не вдалося завантажити медіа");
      } finally {
        setUploading(false);
      }
    },
    [media, onChange]
  );

  const onPickFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      if (file.type.startsWith("video/")) {
        await uploadProcessed(file);
        continue;
      }
      if (!file.type.startsWith("image/")) continue;

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img"));
        img.src = objectUrl;
      });
      setPending({
        file,
        objectUrl,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
      });
      setOffset({ x: 0.5, y: 0.5 });
      return; // one at a time for crop UI
    }
  };

  const confirmCrop = async () => {
    if (!pending) return;
    const { naturalW, naturalH, file } = pending;
    // Cover crop window with 4:5 inside source
    let cropW: number;
    let cropH: number;
    if (naturalW / naturalH > RATIO) {
      cropH = naturalH;
      cropW = naturalH * RATIO;
    } else {
      cropW = naturalW;
      cropH = naturalW / RATIO;
    }
    const maxX = Math.max(0, naturalW - cropW);
    const maxY = Math.max(0, naturalH - cropH);
    const left = Math.min(maxX, Math.max(0, offset.x * naturalW - cropW / 2));
    const top = Math.min(maxY, Math.max(0, offset.y * naturalH - cropH / 2));

    await uploadProcessed(file, {
      x: left / naturalW,
      y: top / naturalH,
      w: cropW / naturalW,
      h: cropH / naturalH,
    });
    URL.revokeObjectURL(pending.objectUrl);
    setPending(null);
  };

  const removeAt = (idx: number) => {
    onChange(media.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= media.length) return;
    const next = [...media];
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            Фото та відео
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Формат Instagram Post 4:5 (1080×1350). При додаванні фото можна
            налаштувати кадр.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn-secondary"
          disabled={uploading || Boolean(pending)}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Обробка…" : "Додати медіа"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,video/mp4,video/webm"
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
            className="group overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]"
          >
            <div className="relative aspect-[4/5] bg-gray-100 dark:bg-gray-800">
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
                  onError={(e) => {
                    // Retry once after a short delay — file may not be
                    // visible to the static layer for a tick after upload.
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
                {m.type === "video" ? "VIDEO" : "4:5"}
                {m.width && m.height ? ` · ${m.width}×${m.height}` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 p-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  className="admin-btn-ghost !px-2"
                  disabled={idx === 0}
                  onClick={() => move(idx, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="admin-btn-ghost !px-2"
                  disabled={idx === media.length - 1}
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
          </div>
        ))}

        {!media.length && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/5] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 transition hover:border-gray-500 hover:text-gray-600 dark:border-gray-600"
          >
            + Додати
          </button>
        )}
      </div>

      {pending && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-900">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Кадр Instagram 4:5
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              Перетягніть зображення, щоб обрати зону обрізки.
            </p>
            <div
              className="relative mx-auto mt-4 aspect-[4/5] w-full max-w-[280px] cursor-grab overflow-hidden rounded-xl border border-gray-200 active:cursor-grabbing dark:border-gray-700"
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                dragRef.current = {
                  startX: e.clientX,
                  startY: e.clientY,
                  ox: offset.x,
                  oy: offset.y,
                };
              }}
              onPointerMove={(e) => {
                if (!dragRef.current) return;
                const dx = (e.clientX - dragRef.current.startX) / 280;
                const dy = (e.clientY - dragRef.current.startY) / 350;
                setOffset({
                  x: Math.min(1, Math.max(0, dragRef.current.ox - dx)),
                  y: Math.min(1, Math.max(0, dragRef.current.oy - dy)),
                });
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pending.objectUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                style={{
                  objectPosition: `${offset.x * 100}% ${offset.y * 100}%`,
                }}
              />
              <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-[#B7E1DF]" />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={() => {
                  URL.revokeObjectURL(pending.objectUrl);
                  setPending(null);
                }}
              >
                Скасувати
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={uploading}
                onClick={() => void confirmCrop()}
              >
                {uploading ? "Обробка…" : "Зберегти кадр"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
