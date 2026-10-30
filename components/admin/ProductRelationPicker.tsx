"use client";

import React, { useMemo, useRef, useState } from "react";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import type { Product } from "@/lib/types";

export type RelationPickerKind = "color-siblings" | "look";

const STEPS: Record<RelationPickerKind, string[]> = {
  "color-siblings": [
    "Кожен колір — окремий товар (⋯ → копія).",
    "Нижче знайдіть і натисніть «Додати».",
    "Збережіть форму внизу.",
  ],
  look: [
    "Спочатку збережіть цей товар.",
    "Пошуком додайте існуючі товари з каталогу.",
    "Збережіть форму — блок з’явиться на сайті.",
  ],
};

type Props = {
  kind: RelationPickerKind;
  label: string;
  /** Short line under the title */
  summary?: string;
  catalog: Product[];
  excludeId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** For «інші кольори»: prioritize same product name */
  currentProductName?: string;
  emptyHint?: string;
};

const SEARCH_LIMIT = 10;
const BROWSE_LIMIT = 24;

function nameSimilarity(productName: string, currentName: string): number {
  const n = currentName.trim().toLowerCase();
  const pn = productName.trim().toLowerCase();
  if (!n || !pn) return 0;
  if (pn === n) return 100;
  if (pn.startsWith(n) || n.startsWith(pn)) return 85;
  const nWords = n.split(/\s+/).filter(Boolean);
  const match = nWords.filter((w) => w.length > 2 && pn.includes(w)).length;
  return match * 15;
}

export default function ProductRelationPicker({
  kind,
  label,
  summary,
  catalog,
  excludeId,
  selectedIds,
  onChange,
  currentProductName = "",
  emptyHint = "Поки нічого не додано — скористайтесь пошуком нижче",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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

  const rankedAvailable = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = available;
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.color || "").toLowerCase().includes(q)
      );
    } else if (kind === "color-siblings" && currentProductName.trim()) {
      list = [...list].sort(
        (a, b) =>
          nameSimilarity(b.name, currentProductName) -
          nameSimilarity(a.name, currentProductName)
      );
    } else {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "uk"));
    }
    return list;
  }, [available, query, kind, currentProductName]);

  const limit = query.trim()
    ? SEARCH_LIMIT
    : browseAll
      ? BROWSE_LIMIT
      : kind === "color-siblings"
        ? 12
        : 8;

  const suggestions = rankedAvailable.slice(0, limit);
  const hasMore = rankedAvailable.length > suggestions.length;

  const showDropdown =
    open &&
    (suggestions.length > 0 ||
      query.trim().length > 0 ||
      rankedAvailable.length > 0);

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

  const steps = STEPS[kind];
  const listHint =
    kind === "color-siblings"
      ? "Порядок тут не впливає на сайт — головне, щоб усі кольори були в списку."
      : "Перший у списку з’явиться ліворуч у блоці луку на сайті.";

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            {label}
          </h3>
          {selected.length > 0 ? (
            <span className="rounded-full bg-[#B7E1DF]/40 px-2 py-0.5 text-[11px] font-semibold text-gray-800 dark:bg-[#B7E1DF]/15 dark:text-[#B7E1DF]">
              додано: {selected.length}
            </span>
          ) : null}
        </div>
        {summary ? (
          <p className="mt-1 hidden text-[13px] text-gray-500 sm:block dark:text-gray-400">
            {summary}
          </p>
        ) : null}
        <button
          type="button"
          className="mt-1 admin-btn-ghost !h-7 !px-0 !text-[12px] text-gray-500"
          onClick={() => setHelpOpen((v) => !v)}
          aria-expanded={helpOpen}
        >
          {helpOpen ? "▴ Сховати підказку" : "▾ Як це працює"}
        </button>
        {helpOpen ? (
          <div className="admin-help-box mt-2" role="note">
            <ol>
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      <div>
        {selected.length > 0 ? (
          <>
            <p className="mb-2 hidden text-[11px] text-gray-400 sm:block">
              {listHint}
            </p>
            <ul className="space-y-2">
              {selected.map((p, i) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500 dark:bg-white/10"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
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
                      {p.color ? `${p.color} · ` : ""}
                      {p.id}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {kind === "look" ? (
                      <>
                        <button
                          type="button"
                          className="admin-btn-ghost !px-1.5 text-xs disabled:opacity-30"
                          disabled={i === 0}
                          onClick={() => move(p.id, -1)}
                          aria-label="Вище в луці"
                          title="Вище в луці"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost !px-1.5 text-xs disabled:opacity-30"
                          disabled={i === selected.length - 1}
                          onClick={() => move(p.id, 1)}
                          aria-label="Нижче в луці"
                          title="Нижче в луці"
                        >
                          ▼
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      className="admin-btn-ghost text-red-600 dark:text-red-400"
                      onClick={() => remove(p.id)}
                      aria-label="Прибрати зі списку"
                      title="Прибрати"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 px-3 py-3 text-center text-[13px] text-gray-500 dark:border-white/10 dark:text-gray-400">
            {emptyHint}
          </p>
        )}
      </div>

      <div className="relative">
        <label className="mb-1.5 block text-[12px] font-semibold text-gray-700 dark:text-gray-300">
          Додати товар
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setBrowseAll(false);
            setOpen(true);
          }}
          onFocus={() => {
            if (blurTimer.current) clearTimeout(blurTimer.current);
            setOpen(true);
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 180);
          }}
          placeholder={
            kind === "color-siblings"
              ? "Пошук: назва моделі, колір або ID…"
              : "Пошук товару для луку…"
          }
          className="admin-input"
          autoComplete="off"
        />
        {showDropdown && (
          <div
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
            onMouseDown={(e) => e.preventDefault()}
          >
            {!query.trim() && kind === "color-siblings" ? (
              <p className="border-b border-gray-100 px-3 py-2 text-[11px] font-medium text-gray-500 dark:border-white/10">
                {currentProductName.trim()
                  ? "Спочатку схожі за назвою — ймовірно той самий виріб"
                  : "Оберіть товар з каталогу"}
              </p>
            ) : null}
            {!query.trim() && kind === "look" ? (
              <p className="border-b border-gray-100 px-3 py-2 text-[11px] font-medium text-gray-500 dark:border-white/10">
                Товари з каталогу — натисніть «Додати»
              </p>
            ) : null}
            <ul className="max-h-72 overflow-auto py-1">
              {suggestions.length === 0 ? (
                <li className="px-3 py-3 text-sm text-gray-400">
                  {available.length === 0
                    ? "Усі товари вже додані або каталог порожній"
                    : "Нічого не знайдено — спробуйте іншу назву"}
                </li>
              ) : (
                suggestions.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
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
                      <span className="shrink-0 rounded-lg bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-white dark:bg-white dark:text-gray-900">
                        Додати
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            {hasMore && !query.trim() ? (
              <div className="border-t border-gray-100 px-3 py-2 dark:border-white/10">
                <button
                  type="button"
                  className="admin-btn-ghost w-full !text-xs"
                  onClick={() => setBrowseAll((v) => !v)}
                >
                  {browseAll
                    ? "Згорнути"
                    : `Ще ${rankedAvailable.length - suggestions.length}`}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
