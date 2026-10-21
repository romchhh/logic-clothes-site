"use client";

import React, { useMemo, useRef, useState } from "react";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import type { Product } from "@/lib/types";

type Props = {
  label: string;
  description?: string;
  /** All catalog products to pick from. */
  catalog: Product[];
  /** Current product id (excluded from results). */
  excludeId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  emptyHint?: string;
};

const SUGGEST_LIMIT = 8;

export default function ProductRelationPicker({
  label,
  description,
  catalog,
  excludeId,
  selectedIds,
  onChange,
  emptyHint = "Нічого не вибрано",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const byId = useMemo(
    () => new Map(catalog.map((p) => [p.id, p])),
    [catalog]
  );

  const selected = useMemo(
    () =>
      selectedIds
        .map((id) => byId.get(id))
        .filter((p): p is Product => Boolean(p)),
    [selectedIds, byId]
  );

  const available = useMemo(
    () =>
      catalog.filter(
        (p) => p.id !== excludeId && !selectedIds.includes(p.id)
      ),
    [catalog, excludeId, selectedIds]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available.slice(0, SUGGEST_LIMIT);
    return available
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.color || "").toLowerCase().includes(q)
      )
      .slice(0, SUGGEST_LIMIT);
  }, [available, query]);

  const showDropdown = open && (suggestions.length > 0 || query.trim().length > 0);

  const add = (id: string) => {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setQuery("");
    setOpen(true);
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = selectedIds.indexOf(id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
          {label}
        </h3>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      {selected.length > 0 ? (
        <ul className="space-y-2">
          {selected.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.03]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProductImageSrc(p.images)}
                alt=""
                className="h-12 w-9 shrink-0 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {p.name}
                </div>
                <div className="truncate text-xs text-gray-400">
                  {p.color || p.id}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  className="admin-btn-ghost !px-1.5 text-xs disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => move(p.id, -1)}
                  aria-label="Вище"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="admin-btn-ghost !px-1.5 text-xs disabled:opacity-30"
                  disabled={i === selected.length - 1}
                  onClick={() => move(p.id, 1)}
                  aria-label="Нижче"
                >
                  ▼
                </button>
                <button
                  type="button"
                  className="admin-btn-ghost text-red-600 dark:text-red-400"
                  onClick={() => remove(p.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-400 dark:border-white/10">
          {emptyHint}
        </p>
      )}

      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          placeholder="Пошук товару за назвою, кольором або ID…"
          className="admin-input"
          autoComplete="off"
        />
        {showDropdown && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            {suggestions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">
                Нічого не знайдено
              </li>
            ) : (
              suggestions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(p.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImageSrc(p.images)}
                      alt=""
                      className="h-10 w-8 rounded object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                        {p.name}
                      </span>
                      <span className="block truncate text-xs text-gray-400">
                        {p.color || "—"} · {p.id}
                      </span>
                    </span>
                    <span className="text-xs font-medium text-gray-500">
                      Додати
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
