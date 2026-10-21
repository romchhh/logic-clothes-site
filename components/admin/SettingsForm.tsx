"use client";

import React, { useEffect, useState } from "react";
import type { SettingKey, SettingsMap } from "@/lib/settingsTypes";

type AdminSettingsResponse = {
  values: SettingsMap;
  masked: Partial<Record<SettingKey, string>>;
  fromEnv: Partial<Record<SettingKey, boolean>>;
};

const FIELDS: Array<{
  key: SettingKey;
  label: string;
  hint: string;
  secret?: boolean;
  placeholder?: string;
}> = [
  {
    key: "telegram_bot_token",
    label: "Telegram Bot Token",
    hint: "Токен бота від @BotFather — сповіщення про замовлення",
    secret: true,
    placeholder: "123456:ABC…",
  },
  {
    key: "telegram_chat_id",
    label: "Telegram Chat ID",
    hint: "ID чату або каналу, куди надсилати замовлення",
    placeholder: "-100…",
  },
  {
    key: "nova_poshta_api_key",
    label: "Нова Пошта API Key",
    hint: "Ключ з my.novaposhta.ua — підвищує ліміти адресного API",
    secret: true,
    placeholder: "xxxxxxxx…",
  },
  {
    key: "site_url",
    label: "URL сайту",
    hint: "Публічна адреса (для фідів і канонічних посилань). Напр. https://logicclothes.ua",
    placeholder: "https://logicclothes.ua",
  },
];

export default function SettingsForm() {
  const [data, setData] = useState<AdminSettingsResponse | null>(null);
  const [draft, setDraft] = useState<Partial<SettingsMap>>({});
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
      setData(json);
      setDraft({
        telegram_bot_token: json.masked.telegram_bot_token || "",
        telegram_chat_id: json.values.telegram_chat_id || "",
        nova_poshta_api_key: json.masked.nova_poshta_api_key || "",
        site_url: json.values.site_url || "",
      });
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити налаштування");
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
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as AdminSettingsResponse;
      setData(json);
      setDraft({
        telegram_bot_token: json.masked.telegram_bot_token || "",
        telegram_chat_id: json.values.telegram_chat_id || "",
        nova_poshta_api_key: json.masked.nova_poshta_api_key || "",
        site_url: json.values.site_url || "",
      });
      setMessage("Збережено");
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

  return (
    <form onSubmit={(e) => void save(e)} className="space-y-6">
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
            <h2 className="admin-panel-title">Інтеграції</h2>
            <p className="admin-panel-desc">
              Значення з адмінки мають пріоритет над `.env`. Секрети показуються
              замасковано — вставте новий ключ повністю, щоб замінити.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          {FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1.5 flex flex-wrap items-center gap-2 text-[13px] font-medium text-gray-700 dark:text-gray-300">
                {field.label}
                {data?.fromEnv[field.key] && !data.values[field.key] && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    з .env
                  </span>
                )}
                {data?.values[field.key] && (
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                    збережено
                  </span>
                )}
              </span>
              <input
                className="admin-input font-mono text-[13px]"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={draft[field.key] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [field.key]: e.target.value }))
                }
                onFocus={() => {
                  if (
                    field.secret &&
                    (draft[field.key] || "").includes("••••")
                  ) {
                    setDraft((d) => ({ ...d, [field.key]: "" }));
                  }
                }}
              />
              <span className="mt-1 block text-xs text-gray-400">
                {field.hint}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Доступ до адмінки</h2>
            <p className="admin-panel-desc">
              Логін і пароль задаються лише в{" "}
              <code className="text-xs">.env.local</code> (
              <code className="text-xs">ADMIN_USER</code> /{" "}
              <code className="text-xs">ADMIN_PASS</code>) і не редагуються тут
              з міркувань безпеки.
            </p>
          </div>
        </div>
      </section>

      <div className="admin-sticky-bar">
        <p className="hidden text-[13px] text-gray-500 sm:block dark:text-gray-400">
          Секрети зберігаються в базі й перевизначають .env
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => void load()}
            disabled={saving}
          >
            Скинути
          </button>
          <button type="submit" className="admin-btn-primary" disabled={saving}>
            {saving ? "Збереження…" : "Зберегти"}
          </button>
        </div>
      </div>
    </form>
  );
}
