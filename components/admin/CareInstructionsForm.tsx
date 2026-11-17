"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CARE_IDS,
  DEFAULT_CARE_INSTRUCTIONS,
  type CareId,
  type CareInstruction,
} from "@/lib/careInstructions";

export default function CareInstructionsForm() {
  const [items, setItems] = useState<CareInstruction[]>(
    DEFAULT_CARE_INSTRUCTIONS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<CareId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Partial<Record<CareId, HTMLInputElement | null>>>(
    {}
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/care-instructions", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { items?: CareInstruction[] };
      if (Array.isArray(json.items) && json.items.length) {
        setItems(json.items);
      }
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити пункти догляду");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateItem = (id: CareId, patch: Partial<CareInstruction>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...patch,
          label: patch.label ? { ...item.label, ...patch.label } : item.label,
          body: patch.body ? { ...item.body, ...patch.body } : item.body,
        };
      })
    );
  };

  const uploadImage = async (id: CareId, file: File) => {
    setUploadingId(id);
    setError(null);
    setMessage(null);
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
      const url = (data.urls || []).find(Boolean);
      if (!url) throw new Error("No url");
      updateItem(id, { image: url });
      setMessage(
        "Фото оновлено — натисніть «Зберегти», щоб опублікувати на сайті"
      );
    } catch {
      setError("Не вдалося завантажити зображення");
    } finally {
      setUploadingId(null);
      const input = fileRefs.current[id];
      if (input) input.value = "";
    }
  };

  const resetDefaults = () => {
    setItems(DEFAULT_CARE_INSTRUCTIONS.map((c) => ({ ...c, label: { ...c.label }, body: { ...c.body } })));
    setMessage("Повернено стандартні тексти й іконки — натисніть «Зберегти»");
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/care-instructions", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { items?: CareInstruction[] };
      if (Array.isArray(json.items)) setItems(json.items);
      setMessage("Збережено");
    } catch {
      setError("Не вдалося зберегти");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Завантаження…</p>;
  }

  const ordered = CARE_IDS.map(
    (id) => items.find((i) => i.id === id) ?? DEFAULT_CARE_INSTRUCTIONS.find((i) => i.id === id)!
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-gray-900">
              Чотири варіанти догляду
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Фото показуються в картці товару в адмінці; назва й текст — у
              розкритті «Догляд» на сайті.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={resetDefaults}
            >
              Скинути за замовчуванням
            </button>
            <button
              type="submit"
              className="admin-btn-primary"
              disabled={saving}
            >
              {saving ? "Збереження…" : "Зберегти"}
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

        <ul className="space-y-6">
          {ordered.map((care) => (
            <li
              key={care.id}
              className="grid gap-4 border border-gray-100 bg-gray-50 p-4 lg:grid-cols-[160px_minmax(0,1fr)]"
            >
              <div className="space-y-2">
                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={care.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <input
                  ref={(el) => {
                    fileRefs.current[care.id] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(care.id, file);
                  }}
                />
                <button
                  type="button"
                  className="admin-btn-secondary w-full"
                  disabled={uploadingId === care.id}
                  onClick={() => fileRefs.current[care.id]?.click()}
                >
                  {uploadingId === care.id ? "Завантаження…" : "Змінити фото"}
                </button>
                <p className="truncate text-[11px] text-gray-400">{care.image}</p>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {care.id}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-gray-500">
                    Назва UA
                    <input
                      className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={care.label.uk}
                      onChange={(e) =>
                        updateItem(care.id, {
                          label: { ...care.label, uk: e.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="block text-xs text-gray-500">
                    Назва EN
                    <input
                      className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={care.label.en}
                      onChange={(e) =>
                        updateItem(care.id, {
                          label: { ...care.label, en: e.target.value },
                        })
                      }
                    />
                  </label>
                </div>
                <label className="block text-xs text-gray-500">
                  Текст UA
                  <textarea
                    className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm"
                    rows={4}
                    value={care.body.uk}
                    onChange={(e) =>
                      updateItem(care.id, {
                        body: { ...care.body, uk: e.target.value },
                      })
                    }
                  />
                </label>
                <label className="block text-xs text-gray-500">
                  Текст EN
                  <textarea
                    className="mt-1 w-full border border-gray-200 bg-white px-3 py-2 text-sm"
                    rows={4}
                    value={care.body.en}
                    onChange={(e) =>
                      updateItem(care.id, {
                        body: { ...care.body, en: e.target.value },
                      })
                    }
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
