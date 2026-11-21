"use client";

import React, { useEffect, useRef, useState } from "react";
import type { StorePhoto } from "@/lib/storePhotos";

export default function StorePhotosForm() {
  const [photos, setPhotos] = useState<StorePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<StorePhoto[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/store-photos", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { photos?: StorePhoto[] };
      setPhotos(Array.isArray(json.photos) ? json.photos : []);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити фото магазину");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const persist = async (next: StorePhoto[], okMessage: string) => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/store-photos", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { photos?: StorePhoto[] };
      const saved = Array.isArray(json.photos) ? json.photos : next;
      setPhotos(saved);
      setMessage(okMessage);
      return saved;
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error && e.message
          ? `Не вдалося зберегти: ${e.message}`
          : "Не вдалося зберегти"
      );
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      for (const file of list) fd.append("images", file);
      fd.append("fit", "hero");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        urls?: string[];
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(
          data.message || data.error || `Помилка завантаження (${res.status})`
        );
      }
      const urls = (data.urls || []).filter(Boolean);
      if (!urls.length) throw new Error("Сервер не повернув файли");
      const next = [
        ...photosRef.current,
        ...urls.map((src) => ({
          src,
          altUk: "",
          altEn: "",
        })),
      ];
      setPhotos(next);
      await persist(
        next,
        "Фото додано й збережено. Допишіть підписи UA/EN нижче й натисніть «Зберегти», якщо змінюєте текст."
      );
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "Не вдалося завантажити зображення"
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updatePhoto = (index: number, patch: Partial<StorePhoto>) => {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const removePhoto = async (index: number) => {
    const next = photosRef.current.filter((_, i) => i !== index);
    setPhotos(next);
    await persist(next, "Фото видалено");
  };

  const movePhoto = (index: number, dir: -1 | 1) => {
    setPhotos((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await persist(photosRef.current, "Збережено. Зміни з’являться на сайті.");
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Завантаження…</p>;
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#141414]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-gray-900 dark:text-white">
              Фото й підписи «наш магазин у Києві»
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Блок під галереєю на сторінці товару. Додайте фото — воно
              зберігається одразу. Підписи UA/EN видно на сайті під фото.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) void uploadImages(e.target.files);
              }}
            />
            <button
              type="button"
              className="admin-btn-secondary"
              disabled={uploading || saving}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Завантаження…" : "Додати фото"}
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={saving || uploading}
            >
              {saving ? "Збереження…" : "Зберегти підписи"}
            </button>
          </div>
        </div>

        {message ? (
          <p className="mb-3 text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {!photos.length ? (
          <p className="text-sm text-gray-500">
            Поки немає фото. Натисніть «Додати фото» (JPEG/PNG/WebP). Порожній
            список після збереження ховає блок на сайті.
          </p>
        ) : (
          <ul className="space-y-4">
            {photos.map((photo, index) => (
              <li
                key={`${photo.src}-${index}`}
                className="grid gap-4 border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[140px_minmax(0,1fr)_auto] dark:border-white/[0.06] dark:bg-white/[0.03]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-xs text-gray-500">
                    Текст під фото (UA)
                    <textarea
                      className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f0f0f]"
                      rows={2}
                      value={photo.altUk}
                      onChange={(e) =>
                        updatePhoto(index, { altUk: e.target.value })
                      }
                      placeholder="Наприклад: Concept store, Софіївська 5"
                    />
                  </label>
                  <label className="block text-xs text-gray-500">
                    Текст під фото (EN)
                    <textarea
                      className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-[#0f0f0f]"
                      rows={2}
                      value={photo.altEn}
                      onChange={(e) =>
                        updatePhoto(index, { altEn: e.target.value })
                      }
                      placeholder="Caption in English"
                    />
                  </label>
                  <p className="truncate text-[11px] text-gray-400">
                    {photo.src}
                  </p>
                </div>
                <div className="flex flex-row gap-2 sm:flex-col">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    disabled={index === 0}
                    onClick={() => movePhoto(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    disabled={index === photos.length - 1}
                    onClick={() => movePhoto(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary text-red-700"
                    disabled={saving}
                    onClick={() => void removePhoto(index)}
                  >
                    Видалити
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
