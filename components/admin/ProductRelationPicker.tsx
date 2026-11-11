"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  summary?: string;
  catalog: Product[];
  excludeId?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentProductName?: string;
  emptyHint?: string;
  onRefreshCatalog?: () => void | Promise<void>;
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
  onRefreshCatalog,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPortalReady(true);
  }, []);

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
    const q = query.trim().toLowerCase().replace(/['ʼ`]/g, "'");
    let list = available;
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const hay = [
          p.name,
          p.nameEn,
          p.id,
          p.sku != null ? String(p.sku) : "",
          p.color,
          p.fabricName,
          p.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .replace(/['ʼ`]/g, "'");
        return tokens.every((t) => hay.includes(t));
      });
      list = [...list].sort((a, b) => {
        const an = a.name.toLowerCase();
        const bn = b.name.toLowerCase();
        const aStarts = an.startsWith(q) ? 0 : an.includes(q) ? 1 : 2;
        const bStarts = bn.startsWith(q) ? 0 : bn.includes(q) ? 1 : 2;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name, "uk");
      });
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
    ? Math.max(SEARCH_LIMIT, 24)
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

  useLayoutEffect(() => {
    if (!showDropdown || !inputRef.current) {
      setMenuBox(null);
      return;
    }
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const pad = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const spaceBelow = vh - r.bottom - gap - pad;
      const spaceAbove = r.top - gap - pad;
      const preferBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
      const maxHeight = Math.max(
        160,
        Math.min(320, preferBelow ? spaceBelow : spaceAbove)
      );
      const top = preferBelow
        ? r.bottom + gap
        : Math.max(pad, r.top - gap - maxHeight);
      const width = Math.min(Math.max(r.width, 200), vw - pad * 2);
      const left = Math.max(pad, Math.min(r.left, vw - width - pad));
      setMenuBox({
        top,
        left,
        width,
        maxHeight,
      });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showDropdown, query, suggestions.length, browseAll]);

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
      ? "Порядок тут не важливий — головне, щоб усі кольори були в списку."
      : "Стрілки змінюють порядок у блоці луку на сайті (перший — ліворуч).";

  const dropdown =
    portalReady && showDropdown && menuBox
      ? createPortal(
          <div
            className="admin-relation-dropdown"
            style={{
              position: "fixed",
              top: menuBox.top,
              left: menuBox.left,
              width: menuBox.width,
              maxHeight: menuBox.maxHeight,
              zIndex: 10060,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {!query.trim() && kind === "color-siblings" ? (
              <p className="admin-relation-dropdown-hint">
                {currentProductName.trim()
                  ? "Спочатку схожі за назвою — ймовірно той самий виріб"
                  : "Оберіть товар з каталогу"}
              </p>
            ) : null}
            {!query.trim() && kind === "look" ? (
              <p className="admin-relation-dropdown-hint">
                Товари з каталогу — натисніть «Додати»
              </p>
            ) : null}
            <ul
              className="admin-relation-dropdown-list"
              style={{ maxHeight: menuBox.maxHeight - 44 }}
            >
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
                          {p.nameEn?.trim() ? (
                            <span className="font-normal text-gray-400">
                              {" "}
                              · {p.nameEn}
                            </span>
                          ) : null}
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
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">
            {label}
          </h3>
          {selected.length > 0 ? (
            <span className="rounded-full bg-[#B7E1DF]/40 px-2 py-0.5 text-[11px] font-semibold text-gray-800 dark:bg-[#B7E1DF]/15 dark:text-[#B7E1DF]">
              {selected.length}
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
            <p className="mb-2 text-[11px] text-gray-400">{listHint}</p>
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
                          aria-label="Ліворуч у луці"
                          title="Ліворуч у луці"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          className="admin-btn-ghost !px-1.5 text-xs disabled:opacity-30"
                          disabled={i === selected.length - 1}
                          onClick={() => move(p.id, 1)}
                          aria-label="Праворуч у луці"
                          title="Праворуч у луці"
                        >
                          →
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

      <div>
        <label className="mb-1.5 block text-[12px] font-semibold text-gray-700 dark:text-gray-300">
          Додати товар
        </label>
        <input
          ref={inputRef}
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
            if (!refreshedRef.current && onRefreshCatalog) {
              refreshedRef.current = true;
              void onRefreshCatalog();
            }
          }}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 180);
          }}
          placeholder={
            kind === "color-siblings"
              ? "Пошук: назва моделі, колір або ID…"
              : "Пошук: назва UK/EN, колір або ID…"
          }
          className="admin-input"
          autoComplete="off"
        />
        {dropdown}
      </div>
    </div>
  );
}
