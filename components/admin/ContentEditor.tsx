"use client";

import React, { useEffect, useMemo, useState } from "react";
import ContentGalleryEditor from "@/components/admin/ContentGalleryEditor";
import ContentImageField from "@/components/admin/ContentImageField";
import MarkdownEditor from "@/components/admin/MarkdownEditor";
import Label from "@/components/admin/form/Label";
import Input from "@/components/admin/form/input/InputField";
import {
  aboutToMarkdown,
  legalToMarkdown,
} from "@/lib/content/markdownDefaults";
import type { LegalPage } from "@/lib/content/legal";
import type { Locale } from "@/lib/i18n/config";
import {
  CONTENT_PAGE_DEFS,
  type AboutLocaleContent,
  type ContentPageSlug,
  type SitePagesStore,
} from "@/lib/sitePagesTypes";

type Lang = Locale;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint ? (
        <p className="text-[12px] leading-snug text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export default function ContentEditor() {
  const [store, setStore] = useState<SitePagesStore | null>(null);
  const [slug, setSlug] = useState<ContentPageSlug>("about");
  const [lang, setLang] = useState<Lang>("uk");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const def = useMemo(
    () => CONTENT_PAGE_DEFS.find((d) => d.slug === slug)!,
    [slug]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SitePagesStore;
      setStore(json);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити контент сторінок");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const about: AboutLocaleContent | null = store ? store.about[lang] : null;

  const legalPage: LegalPage | null =
    store && def.kind === "legal"
      ? store.legal[lang].find((p) => p.slug === slug) ?? null
      : null;

  const patchAbout = (patch: Partial<AboutLocaleContent>) => {
    setStore((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        about: {
          ...prev.about,
          [lang]: { ...prev.about[lang], ...patch },
        },
      };
    });
    setMessage(null);
  };

  const patchLegal = (patch: Partial<LegalPage>) => {
    setStore((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        legal: {
          ...prev.legal,
          [lang]: prev.legal[lang].map((p) =>
            p.slug === slug ? { ...p, ...patch } : p
          ),
        },
      };
    });
    setMessage(null);
  };

  const save = async () => {
    if (!store) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = (await res.json()) as SitePagesStore;
      setStore(saved);
      setMessage("Збережено. Зміни з’являться на сайті одразу або за кілька хвилин.");
    } catch (e) {
      console.error(e);
      setError("Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">Завантаження…</p>
    );
  }

  if (!store) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-error-500">
          {error || "Помилка завантаження"}
        </p>
        <button
          type="button"
          className="admin-btn-secondary"
          onClick={() => void load()}
        >
          Спробувати знову
        </button>
      </div>
    );
  }

  const aboutMarkdown = about ? aboutToMarkdown(about) : "";
  const legalMarkdown = legalPage ? legalToMarkdown(legalPage) : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CONTENT_PAGE_DEFS.map((d) => {
            const active = d.slug === slug;
            return (
              <button
                key={d.slug}
                type="button"
                onClick={() => {
                  setSlug(d.slug);
                  setMessage(null);
                }}
                className={`rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                  active
                    ? "bg-gray-900 text-white dark:bg-[#B7E1DF] dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {(["uk", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLang(l);
                setMessage(null);
              }}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide ${
                lang === l
                  ? "bg-[#B7E1DF] text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-[#141414]">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {def.label}
            <span className="ml-2 text-[12px] font-normal uppercase tracking-wide text-gray-400">
              {lang}
            </span>
          </h2>
          <p className="text-[12px] text-gray-500">
            {def.kind === "about" ? "/about" : `/${slug}`}
          </p>
        </div>

        {def.kind === "about" && about ? (
          <div className="space-y-6">
            <Field label="Заголовок сторінки">
              <Input
                value={about.title}
                onChange={(e) => patchAbout({ title: e.target.value })}
              />
            </Field>

            <ContentImageField
              label="Головне фото (hero)"
              hint="Велике фото зверху сторінки «Про нас»."
              value={about.heroImage || ""}
              onChange={(heroImage) => patchAbout({ heroImage })}
            />

            <Field
              label="Текст (Markdown)"
              hint="Заголовки ##, списки -, **жирний**, _курсив_, [посилання](url). Редагуйте окремо UA і EN."
            >
              <MarkdownEditor
                value={aboutMarkdown}
                onChange={(bodyMarkdown) => patchAbout({ bodyMarkdown })}
                rows={18}
              />
            </Field>

            <ContentGalleryEditor
              images={about.gallery || []}
              onChange={(gallery) => patchAbout({ gallery })}
            />
          </div>
        ) : null}

        {def.kind === "legal" && legalPage ? (
          <div className="space-y-6">
            <Field label="Заголовок сторінки">
              <Input
                value={legalPage.title}
                onChange={(e) => patchLegal({ title: e.target.value })}
              />
            </Field>
            <Field
              label="Мітка оновлення"
              hint='Наприклад: «Оновлено: жовтень 2026». Можна залишити порожнім.'
            >
              <Input
                value={legalPage.updated}
                onChange={(e) => patchLegal({ updated: e.target.value })}
              />
            </Field>

            <ContentImageField
              label="Головне фото (опційно)"
              hint="Якщо додати — з’явиться зверху сторінки, як на «Про нас»."
              value={legalPage.heroImage || ""}
              onChange={(heroImage) => patchLegal({ heroImage })}
            />

            <Field
              label="Текст (Markdown)"
              hint="Весь зміст сторінки: вступ, розділи, списки. Форматування через панель або Markdown."
            >
              <MarkdownEditor
                value={legalMarkdown}
                onChange={(bodyMarkdown) => patchLegal({ bodyMarkdown })}
                rows={20}
              />
            </Field>

            <ContentGalleryEditor
              images={legalPage.gallery || []}
              onChange={(gallery) => patchLegal({ gallery })}
            />
          </div>
        ) : null}

        {def.kind === "legal" && !legalPage ? (
          <p className="text-sm text-gray-500">Сторінку не знайдено в сховищі.</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-[1.25rem] text-sm">
          {error ? <p className="text-error-500">{error}</p> : null}
          {message ? (
            <p className="text-emerald-700 dark:text-emerald-400">{message}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="admin-btn-primary w-full sm:w-auto"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "Збереження…" : "Зберегти всі мови"}
        </button>
      </div>
      <p className="text-[12px] text-gray-500 dark:text-gray-400">
        Зберігаються обидві мови (UK і EN) для всіх сторінок одразу. Фото й
        Markdown можна міняти самостійно без розробника.
      </p>
    </div>
  );
}
