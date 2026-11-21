"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ADMIN_LIST_SORT_OPTIONS,
  parseAdminListSort,
  sortByNameAndDate,
  type AdminListSort,
} from "@/lib/adminListSort";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import { CACHE_KEYS, clearCachedData } from "@/lib/cache";
import type { Product } from "@/lib/types";
import {
  normalizeProductSeason,
  type ProductSeason,
} from "@/lib/productSeason";

type RowState = { season: ProductSeason | null };

function rowFromProduct(p: Product): RowState {
  return { season: normalizeProductSeason(p.season) };
}

function rowsEqual(a: RowState, b: RowState): boolean {
  return a.season === b.season;
}

export default function BulkSeasonEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [initial, setInitial] = useState<Record<string, RowState>>({});
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<AdminListSort>("name-asc");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Product[];
      const list = Array.isArray(data) ? data : [];
      const map: Record<string, RowState> = {};
      for (const p of list) map[p.id] = rowFromProduct(p);
      setProducts(list);
      setInitial(map);
      setRows(map);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити товари");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? products
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            String(p.sku ?? "").toLowerCase().includes(q)
        );
    return sortByNameAndDate(list, sort);
  }, [products, search, sort]);

  const dirtyIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of products) {
      const cur = rows[p.id];
      const orig = initial[p.id];
      if (cur && orig && !rowsEqual(cur, orig)) ids.push(p.id);
    }
    return ids;
  }, [products, rows, initial]);

  function setRow(id: string, season: ProductSeason | null) {
    setRows((prev) => ({
      ...prev,
      [id]: { season },
    }));
    setSavedMsg(null);
  }

  async function saveAll() {
    if (!dirtyIds.length) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const updates = dirtyIds.map((id) => ({
        id,
        season: rows[id].season,
      }));

      const res = await fetch("/api/admin/products/season", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { updated?: number; ok?: boolean };
      if (!data.ok) throw new Error("partial_fail");

      clearCachedData(CACHE_KEYS.PRODUCTS);
      setInitial((prev) => {
        const next = { ...prev };
        for (const id of dirtyIds) next[id] = { ...rows[id] };
        return next;
      });
      setSavedMsg(`Збережено: ${data.updated ?? dirtyIds.length}`);
    } catch (e) {
      console.error(e);
      setError("Не вдалося зберегти сезонність");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4" data-tour="tour-products-season">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за назвою, id, sku…"
            className="admin-input w-full sm:max-w-xs"
          />
          <select
            className="admin-input w-full sm:w-auto"
            value={sort}
            onChange={(e) => setSort(parseAdminListSort(e.target.value))}
          >
            {ADMIN_LIST_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void load()}
            className="admin-btn-secondary"
            disabled={loading || saving}
          >
            Оновити
          </button>
          <button
            type="button"
            onClick={() => void saveAll()}
            className="admin-btn-primary"
            disabled={saving || dirtyIds.length === 0}
          >
            {saving
              ? "Збереження…"
              : dirtyIds.length
                ? `Зберегти (${dirtyIds.length})`
                : "Зберегти"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {savedMsg ? (
        <p className="text-sm text-emerald-700" role="status">
          {savedMsg}
        </p>
      ) : null}

      <div className="admin-panel overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Завантаження…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Нічого не знайдено
          </div>
        ) : (
          filtered.map((p) => {
            const r = rows[p.id] ?? rowFromProduct(p);
            const dirty = initial[p.id] && !rowsEqual(r, initial[p.id]);
            return (
              <div
                key={p.id}
                className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${
                  dirty ? "bg-amber-50/40 dark:bg-amber-950/10" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProductImageSrc(p.images)}
                    alt=""
                    className="h-[80px] w-[54px] shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/products/${encodeURIComponent(p.id)}/edit`}
                      className="truncate text-[14px] font-semibold text-gray-900 hover:underline dark:text-white"
                    >
                      {p.name}
                    </Link>
                    <p className="truncate text-[12px] text-gray-400">{p.id}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 sm:shrink-0">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name={`season-${p.id}`}
                      className="h-4 w-4 border-gray-300"
                      checked={r.season === "summer"}
                      onChange={() => setRow(p.id, "summer")}
                    />
                    Літо
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name={`season-${p.id}`}
                      className="h-4 w-4 border-gray-300"
                      checked={r.season === "winter"}
                      onChange={() => setRow(p.id, "winter")}
                    />
                    Зима
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-800 dark:text-gray-200">
                    <input
                      type="radio"
                      name={`season-${p.id}`}
                      className="h-4 w-4 border-gray-300"
                      checked={r.season == null}
                      onChange={() => setRow(p.id, null)}
                    />
                    Без сезону
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="admin-sticky-bar sm:hidden">
        <button
          type="button"
          onClick={() => void load()}
          className="admin-btn-secondary flex-1 !h-10 !text-xs"
          disabled={loading || saving}
        >
          Оновити
        </button>
        <button
          type="button"
          onClick={() => void saveAll()}
          className="admin-btn-primary flex-[1.4] !h-10 !text-xs"
          disabled={saving || dirtyIds.length === 0}
        >
          {saving
            ? "Збереження…"
            : dirtyIds.length
              ? `Зберегти (${dirtyIds.length})`
              : "Зберегти"}
        </button>
      </div>
    </div>
  );
}
