"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Category } from "@/lib/categories";
import { slugFromLabels } from "@/lib/slug";

type Draft = {
  labelUk: string;
  labelEn: string;
  ctaUk: string;
  ctaEn: string;
  image: string;
  isVisible: boolean;
};

const EMPTY_DRAFT: Draft = {
  labelUk: "",
  labelEn: "",
  ctaUk: "До категорії",
  ctaEn: "Shop now",
  image: "",
  isVisible: true,
};

function kindBadge(c: Category) {
  if (c.kind === "collection") {
    return (
      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        Колекція
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-white/10 dark:text-gray-300">
      Категорія
    </span>
  );
}

export default function CategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Category[];
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити категорії");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useScrollLock(modalOpen);

  const productCats = useMemo(
    () => categories.filter((c) => c.kind === "category"),
    [categories]
  );
  const collections = useMemo(
    () => categories.filter((c) => c.kind === "collection"),
    [categories]
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setDraft({
      labelUk: c.label.uk,
      labelEn: c.label.en,
      ctaUk: c.cta.uk,
      ctaEn: c.cta.en,
      image: c.image,
      isVisible: c.isVisible,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const previewSlug = useMemo(
    () =>
      editingId ||
      slugFromLabels({ uk: draft.labelUk, en: draft.labelEn }) ||
      "—",
    [editingId, draft.labelUk, draft.labelEn]
  );

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setFormError(null);
    try {
      const fd = new FormData();
      fd.append("images", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { urls?: string[] };
      const url = data.urls?.[0];
      if (!url) throw new Error("No url");
      setDraft((d) => ({ ...d, image: url }));
    } catch {
      setFormError("Не вдалося завантажити зображення");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (!draft.labelUk.trim() || !draft.labelEn.trim()) {
        throw new Error("Заповніть назви UK і EN");
      }

      const payload = {
        image: draft.image,
        label: { uk: draft.labelUk, en: draft.labelEn },
        cta: { uk: draft.ctaUk, en: draft.ctaEn },
        isVisible: draft.isVisible,
        kind: "category" as const,
      };

      const res = editingId
        ? await fetch(
            `/api/admin/categories/${encodeURIComponent(editingId)}`,
            {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }
          )
        : await fetch("/api/admin/categories", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisible = async (c: Category) => {
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(c.id)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVisible: !c.isVisible }),
        }
      );
      if (!res.ok) throw new Error("fail");
      await load();
    } catch {
      setError("Не вдалося змінити видимість");
    }
  };

  const remove = async (c: Category) => {
    if (c.isSystem) return;
    if (
      !confirm(
        `Видалити категорію «${c.label.uk}»? Товари з цією категорією мають бути перепризначені.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/categories/${encodeURIComponent(c.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося видалити");
    }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const ids = categories.map((c) => c.id);
    const idx = ids.indexOf(id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= ids.length) return;
    const next = [...ids];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setCategories((prev) => {
      const map = Object.fromEntries(prev.map((c) => [c.id, c]));
      return next.map((cid, i) => ({ ...map[cid], sortOrder: i }));
    });
    try {
      await fetch("/api/admin/categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reorder", ids: next }),
      });
    } catch {
      await load();
    }
  };

  return (
    <div className="space-y-6" data-tour="tour-categories-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "…" : categories.length} у каталозі ·{" "}
          {loading ? "…" : productCats.length} для товарів
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="admin-btn-primary w-full sm:w-auto"
        >
          Додати категорію
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Колекції на вітрині</h2>
            <p className="admin-panel-desc">
              Системні підбірки (Бестселери, Новинки). Можна змінити назву й
              фото, але не видалити.
            </p>
          </div>
        </div>
        <CategoryRows
          items={collections}
          allIds={categories.map((c) => c.id)}
          loading={loading}
          onEdit={openEdit}
          onToggle={toggleVisible}
          onDelete={remove}
          onMove={move}
        />
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">Категорії товарів</h2>
            <p className="admin-panel-desc">
              Призначаються товарам у формі редагування. Порядок впливає на
              фільтри та карусель на головній.
            </p>
          </div>
        </div>
        <CategoryRows
          items={productCats}
          allIds={categories.map((c) => c.id)}
          loading={loading}
          onEdit={openEdit}
          onToggle={toggleVisible}
          onDelete={remove}
          onMove={move}
        />
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={closeModal}
          role="presentation"
        >
          <div
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cat-modal-title"
            data-scroll-lock-allow
          >
            <h3
              id="cat-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {editingId ? "Редагувати категорію" : "Нова категорія"}
            </h3>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Назва (UK)">
                  <input
                    className="admin-input"
                    value={draft.labelUk}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, labelUk: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Назва (EN)">
                  <input
                    className="admin-input"
                    value={draft.labelEn}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, labelEn: e.target.value }))
                    }
                  />
                </Field>
                <Field label="CTA (UK)">
                  <input
                    className="admin-input"
                    value={draft.ctaUk}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ctaUk: e.target.value }))
                    }
                  />
                </Field>
                <Field label="CTA (EN)">
                  <input
                    className="admin-input"
                    value={draft.ctaEn}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ctaEn: e.target.value }))
                    }
                  />
                </Field>
              </div>

              <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
                Slug:{" "}
                <code className="font-medium text-gray-800 dark:text-gray-200">
                  {previewSlug}
                </code>
                {!editingId && (
                  <span className="ml-1 text-gray-400">
                    (з назви EN, або UK якщо EN порожня)
                  </span>
                )}
              </p>

              <Field label="Зображення">
                <div className="flex items-start gap-3">
                  {draft.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.image}
                      alt=""
                      className="h-20 w-16 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                  ) : (
                    <div className="flex h-20 w-16 items-center justify-center rounded-lg border border-dashed border-gray-300 text-[10px] text-gray-400 dark:border-gray-600">
                      немає
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      className="admin-input"
                      value={draft.image}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, image: e.target.value }))
                      }
                      placeholder="/assets/products/..."
                    />
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="admin-btn-secondary !py-1.5 !px-3 text-xs">
                        {uploading ? "Завантаження…" : "Завантажити файл"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void uploadImage(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </Field>

              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={draft.isVisible}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, isVisible: e.target.checked }))
                  }
                  className="size-4 rounded border-gray-300"
                />
                Показувати на сайті
              </label>

              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={closeModal}
                disabled={saving}
              >
                Скасувати
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() => void save()}
                disabled={saving || uploading}
              >
                {saving ? "Збереження…" : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-gray-400">{hint}</span>
      )}
    </label>
  );
}

function CategoryRows({
  items,
  allIds,
  loading,
  onEdit,
  onToggle,
  onDelete,
  onMove,
}: {
  items: Category[];
  allIds: string[];
  loading: boolean;
  onEdit: (c: Category) => void;
  onToggle: (c: Category) => void;
  onDelete: (c: Category) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-sm text-gray-500">
        Завантаження…
      </div>
    );
  }
  if (!items.length) {
    return (
      <div className="px-5 py-8 text-center text-sm text-gray-500">
        Поки порожньо
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06] md:hidden">
        {items.map((c) => {
          const idx = allIds.indexOf(c.id);
          return (
            <div key={c.id} className="flex gap-2.5 px-3 py-3">
              <div className="flex shrink-0 flex-col items-center gap-0.5 pt-1">
                <button
                  type="button"
                  className="admin-btn-icon !h-7 !w-7 text-[10px]"
                  disabled={idx <= 0}
                  onClick={() => onMove(c.id, -1)}
                  aria-label="Вище"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="admin-btn-icon !h-7 !w-7 text-[10px]"
                  disabled={idx < 0 || idx >= allIds.length - 1}
                  onClick={() => onMove(c.id, 1)}
                  aria-label="Нижче"
                >
                  ↓
                </button>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2.5">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.image}
                      alt=""
                      className="h-12 w-9 shrink-0 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                    />
                  ) : (
                    <div className="h-12 w-9 shrink-0 rounded-md bg-gray-100 dark:bg-gray-800" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900 dark:text-white">
                      {c.label.uk}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                      {kindBadge(c)}
                      {c.kind === "category" ? (
                        <span>{c.productCount ?? 0} тов.</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggle(c)}
                    className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-semibold ${
                      c.isVisible
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                    }`}
                  >
                    {c.isVisible ? "Видима" : "Прихована"}
                  </button>
                  <button
                    type="button"
                    className="admin-btn-secondary !h-8 !px-3 !text-xs"
                    onClick={() => onEdit(c)}
                  >
                    Змінити
                  </button>
                  {!c.isSystem && (
                    <button
                      type="button"
                      className="admin-btn-danger !h-8"
                      onClick={() => onDelete(c)}
                    >
                      Видалити
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-gray-100 dark:border-white/[0.06]">
              <th className="admin-th w-10" />
              <th className="admin-th">Категорія</th>
              <th className="admin-th">Тип</th>
              <th className="admin-th">Товарів</th>
              <th className="admin-th">Статус</th>
              <th className="admin-th text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {items.map((c) => {
              const idx = allIds.indexOf(c.id);
              return (
                <tr
                  key={c.id}
                  className="group transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 dark:hover:bg-white/10"
                        disabled={idx <= 0}
                        onClick={() => onMove(c.id, -1)}
                        aria-label="Вище"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 dark:hover:bg-white/10"
                        disabled={idx < 0 || idx >= allIds.length - 1}
                        onClick={() => onMove(c.id, 1)}
                        aria-label="Нижче"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.image}
                          alt=""
                          className="h-12 w-9 rounded-md border border-gray-200 object-cover dark:border-gray-700"
                        />
                      ) : (
                        <div className="h-12 w-9 rounded-md bg-gray-100 dark:bg-gray-800" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {c.label.uk}
                        </div>
                        <div className="text-xs text-gray-400">
                          {c.label.en} · <code>{c.id}</code>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{kindBadge(c)}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-gray-600 dark:text-gray-400">
                    {c.kind === "category" ? (c.productCount ?? 0) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onToggle(c)}
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        c.isVisible
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                      }`}
                    >
                      {c.isVisible ? "Видима" : "Прихована"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        className="admin-btn-secondary !h-8 !px-3 !text-xs"
                        onClick={() => onEdit(c)}
                      >
                        Змінити
                      </button>
                      {!c.isSystem && (
                        <button
                          type="button"
                          className="admin-btn-danger"
                          onClick={() => onDelete(c)}
                        >
                          Видалити
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
