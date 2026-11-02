"use client";

import React, { useEffect, useMemo, useState } from "react";
import Label from "@/components/admin/form/Label";
import Input from "@/components/admin/form/input/InputField";
import TextArea from "@/components/admin/form/input/TextArea";
import {
  CONTENT_PAGE_DEFS,
  type AboutLocaleContent,
  type ContentPageSlug,
  type SitePagesStore,
} from "@/lib/sitePagesTypes";
import type { LegalPage, LegalSection } from "@/lib/content/legal";
import type { Locale } from "@/lib/i18n/config";

type Lang = Locale;

function linesToText(lines: string[] | undefined): string {
  return (lines ?? []).join("\n");
}

function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
}

/** Paragraphs may contain single newlines; separate blocks with a blank line. */
function paragraphsToText(paragraphs: string[] | undefined): string {
  return (paragraphs ?? []).join("\n\n");
}

function textToParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+$/g, "").replace(/^\s+/g, ""))
    .filter((p) => p.length > 0);
}

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

  const about: AboutLocaleContent | null = store
    ? store.about[lang]
    : null;

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

  const patchSection = (index: number, patch: Partial<LegalSection>) => {
    if (!legalPage) return;
    const sections = legalPage.sections.map((s, i) =>
      i === index ? { ...s, ...patch } : s
    );
    patchLegal({ sections });
  };

  const addSection = () => {
    if (!legalPage) return;
    patchLegal({
      sections: [
        ...legalPage.sections,
        { heading: "Новий розділ", paragraphs: [""] },
      ],
    });
  };

  const removeSection = (index: number) => {
    if (!legalPage) return;
    patchLegal({
      sections: legalPage.sections.filter((_, i) => i !== index),
    });
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
      setMessage("Збережено. Зміни з’являться на сайті протягом кількох хвилин.");
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
        <p className="text-sm text-error-500">{error || "Помилка завантаження"}</p>
        <button type="button" className="admin-btn-secondary" onClick={() => void load()}>
          Спробувати знову
        </button>
      </div>
    );
  }

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
          <div className="space-y-5">
            <Field label="Заголовок">
              <Input
                value={about.title}
                onChange={(e) => patchAbout({ title: e.target.value })}
              />
            </Field>
            <Field label="Лід (підзаголовок)">
              <TextArea
                rows={3}
                value={about.lead}
                onChange={(v) => patchAbout({ lead: v })}
              />
            </Field>
            <Field
              label="Блок кастому — заголовок"
              hint="Опційно. Якщо порожньо — блок на сайті не показується."
            >
              <Input
                value={about.customTitle}
                onChange={(e) => patchAbout({ customTitle: e.target.value })}
              />
            </Field>
            <Field label="Блок кастому — текст">
              <TextArea
                rows={4}
                value={about.customBody}
                onChange={(v) => patchAbout({ customBody: v })}
              />
            </Field>
            <Field label="Заголовок списку">
              <Input
                value={about.sectionTitle}
                onChange={(e) => patchAbout({ sectionTitle: e.target.value })}
              />
            </Field>
            <Field
              label="Пункти списку"
              hint="Кожен рядок — окремий пункт."
            >
              <TextArea
                rows={12}
                value={linesToText(about.points)}
                onChange={(v) => patchAbout({ points: textToLines(v) })}
              />
            </Field>
            <Field label="Закриття — заголовок">
              <Input
                value={about.closingTitle}
                onChange={(e) => patchAbout({ closingTitle: e.target.value })}
              />
            </Field>
            <Field
              label="Закриття — рядки"
              hint="Кожен рядок — окремий абзац."
            >
              <TextArea
                rows={5}
                value={linesToText(about.closing)}
                onChange={(v) => patchAbout({ closing: textToLines(v) })}
              />
            </Field>
          </div>
        ) : null}

        {def.kind === "legal" && legalPage ? (
          <div className="space-y-5">
            <Field label="Заголовок сторінки">
              <Input
                value={legalPage.title}
                onChange={(e) => patchLegal({ title: e.target.value })}
              />
            </Field>
            <Field label="Мітка оновлення" hint='Наприклад: «Оновлено: жовтень 2026»'>
              <Input
                value={legalPage.updated}
                onChange={(e) => patchLegal({ updated: e.target.value })}
              />
            </Field>
            <Field label="Вступ">
              <TextArea
                rows={3}
                value={legalPage.intro}
                onChange={(v) => patchLegal({ intro: v })}
              />
            </Field>

            <div className="space-y-4 border-t border-gray-100 pt-5 dark:border-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Розділи
                </h3>
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={addSection}
                >
                  + Розділ
                </button>
              </div>

              {legalPage.sections.map((section, index) => (
                <div
                  key={`${section.heading}-${index}`}
                  className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/80 p-4 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Field label={`Розділ ${index + 1} — заголовок`}>
                      <Input
                        value={section.heading}
                        onChange={(e) =>
                          patchSection(index, { heading: e.target.value })
                        }
                      />
                    </Field>
                    <button
                      type="button"
                      className="mt-7 shrink-0 rounded-lg px-2 py-1.5 text-[12px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => removeSection(index)}
                      aria-label="Видалити розділ"
                    >
                      Видалити
                    </button>
                  </div>
                  <Field
                    label="Абзаци"
                    hint="Окремі абзаци розділяйте порожнім рядком. Перенос усередині абзацу — звичайний Enter."
                  >
                    <TextArea
                      rows={4}
                      value={paragraphsToText(section.paragraphs)}
                      onChange={(v) =>
                        patchSection(index, {
                          paragraphs: textToParagraphs(v).length
                            ? textToParagraphs(v)
                            : undefined,
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="Список (булети)"
                    hint="Кожен рядок — пункт списку. Залиште порожнім, якщо список не потрібен."
                  >
                    <TextArea
                      rows={4}
                      value={linesToText(section.bullets)}
                      onChange={(v) =>
                        patchSection(index, {
                          bullets: textToLines(v).length
                            ? textToLines(v)
                            : undefined,
                        })
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>
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
        Зберігаються обидві мови (UK і EN) для всіх сторінок одразу. Редагуйте
        вкладки й мови, потім натисніть «Зберегти».
      </p>
    </div>
  );
}
