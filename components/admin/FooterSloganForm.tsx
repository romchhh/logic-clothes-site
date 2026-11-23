"use client";

import React, { useEffect, useState } from "react";
import type { SettingKey, SettingsMap } from "@/lib/settingsTypes";
import { FOOTER_SETTING_KEYS } from "@/lib/settingsTypes";
import Label from "@/components/admin/form/Label";

type AdminSettingsResponse = {
  values: SettingsMap;
  masked: Partial<Record<SettingKey, string>>;
  fromEnv: Partial<Record<SettingKey, boolean>>;
};

type Draft = {
  footer_slogan_uk: string;
  footer_slogan_en: string;
  footer_slogan_accent_uk: string;
  footer_slogan_accent_en: string;
};

const EMPTY: Draft = {
  footer_slogan_uk: "",
  footer_slogan_en: "",
  footer_slogan_accent_uk: "",
  footer_slogan_accent_en: "",
};

const DEFAULTS: Draft = {
  footer_slogan_uk:
    "Ми не стежимо за трендами. Ми не виробляємо речі, які роками безцільно висітимуть у шафах. Ми виробляємо тільки те, що дійсно",
  footer_slogan_en:
    "We do not follow trends. We do not make pieces that hang unused for years. We make only what is truly",
  footer_slogan_accent_uk: "LOGIC",
  footer_slogan_accent_en: "LOGIC",
};

function draftFromValues(values: SettingsMap): Draft {
  return {
    footer_slogan_uk: values.footer_slogan_uk || "",
    footer_slogan_en: values.footer_slogan_en || "",
    footer_slogan_accent_uk: values.footer_slogan_accent_uk || "",
    footer_slogan_accent_en: values.footer_slogan_accent_en || "",
  };
}

export default function FooterSloganForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const next = draftFromValues(json.values);
      setDraft({
        footer_slogan_uk: next.footer_slogan_uk || DEFAULTS.footer_slogan_uk,
        footer_slogan_en: next.footer_slogan_en || DEFAULTS.footer_slogan_en,
        footer_slogan_accent_uk:
          next.footer_slogan_accent_uk || DEFAULTS.footer_slogan_accent_uk,
        footer_slogan_accent_en:
          next.footer_slogan_accent_en || DEFAULTS.footer_slogan_accent_en,
      });
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити слоган футера");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const patch: Partial<Record<(typeof FOOTER_SETTING_KEYS)[number], string>> =
        {
          footer_slogan_uk: draft.footer_slogan_uk.trim(),
          footer_slogan_en: draft.footer_slogan_en.trim(),
          footer_slogan_accent_uk: draft.footer_slogan_accent_uk.trim(),
          footer_slogan_accent_en: draft.footer_slogan_accent_en.trim(),
        };
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminSettingsResponse;
      const next = draftFromValues(json.values);
      setDraft({
        footer_slogan_uk: next.footer_slogan_uk || DEFAULTS.footer_slogan_uk,
        footer_slogan_en: next.footer_slogan_en || DEFAULTS.footer_slogan_en,
        footer_slogan_accent_uk:
          next.footer_slogan_accent_uk || DEFAULTS.footer_slogan_accent_uk,
        footer_slogan_accent_en:
          next.footer_slogan_accent_en || DEFAULTS.footer_slogan_accent_en,
      });
      setMessage("Збережено. Текст у футері оновиться одразу або за кілька хвилин.");
    } catch (err) {
      console.error(err);
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

  return (
    <form
      onSubmit={save}
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-800 dark:bg-[#141414]"
    >
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Слоган у футері
        </h2>
        <p className="text-[12px] leading-snug text-gray-500 dark:text-gray-400">
          Текст унизу сторінок: «Ми не стежимо за трендами…» + виділене слово
          (напр. LOGIC). Порожнє поле = дефолт з мови сайту.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-3">
          <Label>Текст (UA)</Label>
          <textarea
            className="min-h-[110px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-white"
            value={draft.footer_slogan_uk}
            onChange={(e) =>
              setDraft((d) => ({ ...d, footer_slogan_uk: e.target.value }))
            }
          />
          <Label>Виділене слово (UA)</Label>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-white"
            value={draft.footer_slogan_accent_uk}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                footer_slogan_accent_uk: e.target.value,
              }))
            }
          />
        </div>
        <div className="space-y-3">
          <Label>Текст (EN)</Label>
          <textarea
            className="min-h-[110px] w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-white"
            value={draft.footer_slogan_en}
            onChange={(e) =>
              setDraft((d) => ({ ...d, footer_slogan_en: e.target.value }))
            }
          />
          <Label>Виділене слово (EN)</Label>
          <input
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-white"
            value={draft.footer_slogan_accent_en}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                footer_slogan_accent_en: e.target.value,
              }))
            }
          />
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-error-500">{error}</p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="admin-btn-primary disabled:opacity-60"
        >
          {saving ? "Збереження…" : "Зберегти слоган"}
        </button>
      </div>
    </form>
  );
}
