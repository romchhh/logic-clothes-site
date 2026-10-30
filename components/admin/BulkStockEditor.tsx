"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import { CACHE_KEYS, clearCachedData } from "@/lib/cache";
import type { Product } from "@/lib/types";

type RowState = { inStock: boolean; madeToOrder: boolean };

function rowFromProduct(p: Product): RowState {
  return {
    inStock: Boolean(p.inStock),
    madeToOrder: Boolean(p.madeToOrder),
  };
}

function rowsEqual(a: RowState, b: RowState): boolean {
  return a.inStock === b.inStock && a.madeToOrder === b.madeToOrder;
}

export default function BulkStockEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [initial, setInitial] = useState<Record<string, RowState>>({});
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [search, setSearch] = useState("");
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
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        String(p.sku ?? "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const dirtyIds = useMemo(() => {
    const ids: string[] = [];
    for (const p of products) {
      const cur = rows[p.id];
      const orig = initial[p.id];
      if (cur && orig && !rowsEqual(cur, orig)) ids.push(p.id);
    }
    return ids;
  }, [products, rows, initial]);

  function setRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
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
        inStock: rows[id].inStock,
        madeToOrder: rows[id].madeToOrder,
      }));

      const res = await fetch("/api/admin/products/stock", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { updated?: number; ok?: boolean };
      if (!data.ok) throw new Error("partial_fail");

      clearCachedData(CACHE_KEYS.PRODUCTS);
      const nextInitial = { ...initial };
      for (const id of dirtyIds) {
        nextInitial[id] = { ...rows[id] };
      }
      setInitial(nextInitial);
      setSavedMsg(`Збережено ${data.updated ?? dirtyIds.length} товарів`);
    } catch (e) {
      console.error(e);
      setError("Не вдалося зберегти статуси");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head flex-wrap gap-3">
        <div>
          <h2 className="admin-panel-title">Статус наявності</h2>
          <p className="admin-panel-desc">
            {loading
              ? "Завантаження…"
              : `${products.length} товарів · змінено: ${dirtyIds.length}`}
          </p>
        </div>
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void load()}
            className="admin-btn-secondary !h-9 !px-3 !text-xs"
            disabled={loading || saving}
          >
            Оновити
          </button>
          <button
            type="button"
            onClick={() => void saveAll()}
            className="admin-btn-primary !h-9 !px-4 !text-xs"
            disabled={saving || dirtyIds.length === 0}
          >
            {saving ? "Збереження…" : "Зберегти всі зміни"}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 px-4 py-3 dark:border-white/[0.05] sm:px-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою або ID…"
          className="admin-input max-w-md"
        />
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50/80 px-5 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {savedMsg && (
        <div className="border-b border-emerald-100 bg-emerald-50/80 px-5 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {savedMsg}
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
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

                <div className="flex flex-wrap items-center gap-5 sm:shrink-0">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={r.inStock}
                      onChange={(e) =>
                        setRow(p.id, { inStock: e.target.checked })
                      }
                    />
                    В наявності
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={r.madeToOrder}
                      onChange={(e) =>
                        setRow(p.id, { madeToOrder: e.target.checked })
                      }
                    />
                    Зшиємо за 14 днів
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
