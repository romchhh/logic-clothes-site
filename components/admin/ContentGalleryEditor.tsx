"use client";

import React, { useRef, useState } from "react";
import type { ContentGalleryImage } from "@/lib/sitePagesTypes";

type Props = {
  images: ContentGalleryImage[];
  onChange: (images: ContentGalleryImage[]) => void;
};

export default function ContentGalleryEditor({ images, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      for (const file of list) fd.append("images", file);
      fd.append("fit", "hero");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("upload failed");
      const data = (await res.json()) as { urls?: string[] };
      const urls = (data.urls || []).filter(Boolean);
      if (!urls.length) throw new Error("no urls");
      onChange([
        ...images,
        ...urls.map((src) => ({
          src,
          altUk: "",
          altEn: "",
        })),
      ]);
    } catch {
      setError("Не вдалося завантажити");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const patch = (index: number, patch: Partial<ContentGalleryImage>) => {
    onChange(images.map((img, i) => (i === index ? { ...img, ...patch } : img)));
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[index], next[j]] = [next[j], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Галерея фото
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500">
            Показуються під текстом сторінки. Можна кілька.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void upload(e.target.files);
            }}
          />
          <button
            type="button"
            className="admin-btn-secondary"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? "Завантаження…" : "Додати фото"}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!images.length ? (
        <p className="text-[12px] text-gray-400">Галерея порожня</p>
      ) : (
        <ul className="space-y-3">
          {images.map((img, index) => (
            <li
              key={`${img.src}-${index}`}
              className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto] dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <div className="aspect-[4/3] overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-gray-500">
                  Підпис UA
                  <input
                    className="mt-1 w-full border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-[#0f0f0f]"
                    value={img.altUk}
                    onChange={(e) => patch(index, { altUk: e.target.value })}
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Підпис EN
                  <input
                    className="mt-1 w-full border border-gray-200 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-[#0f0f0f]"
                    value={img.altEn}
                    onChange={(e) => patch(index, { altEn: e.target.value })}
                  />
                </label>
              </div>
              <div className="flex flex-row gap-2 sm:flex-col">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="admin-btn-secondary text-red-700"
                  onClick={() => remove(index)}
                >
                  Видалити
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
