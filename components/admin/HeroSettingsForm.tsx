"use client";

import React, { useEffect, useRef, useState } from "react";
import type { SettingKey, SettingsMap } from "@/lib/settingsTypes";
import { HERO_SETTING_KEYS } from "@/lib/settingsTypes";

type AdminSettingsResponse = {
  values: SettingsMap;
  masked: Partial<Record<SettingKey, string>>;
  fromEnv: Partial<Record<SettingKey, boolean>>;
};

type Draft = {
  hero_image: string;
  hero_image_position: string;
  hero_since_uk: string;
  hero_since_en: string;
  hero_title_uk: string;
  hero_title_en: string;
  hero_subtitle_uk: string;
  hero_subtitle_en: string;
};

const DEFAULT_IMAGE = "/assets/hero.png";
const DEFAULT_POSITION = "center 22%";

const EMPTY: Draft = {
  hero_image: "",
  hero_image_position: DEFAULT_POSITION,
  hero_since_uk: "",
  hero_since_en: "",
  hero_title_uk: "",
  hero_title_en: "",
  hero_subtitle_uk: "",
  hero_subtitle_en: "",
};

function draftFromValues(values: SettingsMap): Draft {
  return {
    hero_image: values.hero_image || "",
    hero_image_position: values.hero_image_position || DEFAULT_POSITION,
    hero_since_uk: values.hero_since_uk || "",
    hero_since_en: values.hero_since_en || "",
    hero_title_uk: values.hero_title_uk || "",
    hero_title_en: values.hero_title_en || "",
    hero_subtitle_uk: values.hero_subtitle_uk || "",
    hero_subtitle_en: values.hero_subtitle_en || "",
  };
}

export default function HeroSettingsForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminSettingsResponse;
      setDraft(draftFromValues(json.values));
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити налаштування hero");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("images", file);
      fd.append("fit", "hero");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { urls?: string[] };
      const url = data.urls?.[0];
      if (!url) throw new Error("No url");
      set("hero_image", url);
      setMessage("Фото завантажено — натисніть «Зберегти», щоб опублікувати");
    } catch {
      setError("Не вдалося завантажити зображення");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const patch: Partial<Record<SettingKey, string>> = {};
      for (const key of HERO_SETTING_KEYS) {
        patch[key] = draft[key] ?? "";
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminSettingsResponse;
      setDraft(draftFromValues(json.values));
      setMessage("Hero збережено — зміни з’являться на головній");
    } catch (err) {
      console.error(err);
      setError("Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel px-5 py-8 text-sm text-gray-500">
        Завантаження…
      </div>
    );
  }

  const previewSrc = draft.hero_image.trim() || DEFAULT_IMAGE;

  return (
    <form
      onSubmit={(e) => void save(e)}
      className="space-y-6"
      data-tour="tour-hero-page"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Фото hero</h2>
            <p className="admin-panel-desc">
              Повноекранне зображення на головній. Краще горизонтальне фото
              ~1920×2400 або ширше.
            </p>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="relative aspect-[16/10] max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: draft.hero_image_position || DEFAULT_POSITION }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="admin-btn-secondary"
              disabled={uploading || saving}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Завантаження…" : "Завантажити фото"}
            </button>
            {draft.hero_image && (
              <button
                type="button"
                className="admin-btn-ghost"
                disabled={saving}
                onClick={() => set("hero_image", "")}
              >
                Скинути на дефолт
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,*/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadImage(f);
                e.target.value = "";
              }}
            />
          </div>
          <label className="block max-w-md">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Позиція кадру (CSS object-position)
            </span>
            <input
              className="admin-input"
              value={draft.hero_image_position}
              onChange={(e) => set("hero_image_position", e.target.value)}
              placeholder="center 22%"
            />
            <span className="mt-1 block text-xs text-gray-400">
              Напр. <code>center 22%</code>, <code>center top</code>,{" "}
              <code>50% 30%</code>
            </span>
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Напис «З …»</h2>
            <p className="admin-panel-desc">
              Текст біля жовто-синіх мазків у лівому нижньому куті hero.
            </p>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Українською
            </span>
            <input
              className="admin-input"
              value={draft.hero_since_uk}
              onChange={(e) => set("hero_since_uk", e.target.value)}
              placeholder="З 2015"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
              English
            </span>
            <input
              className="admin-input"
              value={draft.hero_since_en}
              onChange={(e) => set("hero_since_en", e.target.value)}
              placeholder="Since 2015"
            />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Заголовок і підзаголовок</h2>
            <p className="admin-panel-desc">
              Опційно. Якщо залишити порожнім — на hero лишаються лише фото,
              категорії та мітка «З …».
            </p>
          </div>
        </div>
        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Заголовок (UK)
              </span>
              <input
                className="admin-input"
                value={draft.hero_title_uk}
                onChange={(e) => set("hero_title_uk", e.target.value)}
                placeholder="Logic Clothes"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Title (EN)
              </span>
              <input
                className="admin-input"
                value={draft.hero_title_en}
                onChange={(e) => set("hero_title_en", e.target.value)}
                placeholder="Logic Clothes"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Підзаголовок (UK)
              </span>
              <textarea
                className="admin-input min-h-[88px] resize-y"
                value={draft.hero_subtitle_uk}
                onChange={(e) => set("hero_subtitle_uk", e.target.value)}
                placeholder="Короткий текст під заголовком…"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Subtitle (EN)
              </span>
              <textarea
                className="admin-input min-h-[88px] resize-y"
                value={draft.hero_subtitle_en}
                onChange={(e) => set("hero_subtitle_en", e.target.value)}
                placeholder="Short line under the title…"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="admin-sticky-bar">
        <p className="hidden text-[13px] text-gray-500 sm:block dark:text-gray-400">
          Зміни на головній після збереження
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => void load()}
            disabled={saving || uploading}
          >
            Скинути
          </button>
          <button
            type="submit"
            className="admin-btn-primary"
            disabled={saving || uploading}
          >
            {saving ? "Збереження…" : "Зберегти"}
          </button>
        </div>
      </div>
    </form>
  );
}
