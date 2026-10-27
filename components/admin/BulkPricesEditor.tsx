"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatStoredForexPrice,
  parsePriceInput,
} from "@/lib/adminProductPrices";
import { UAH_PER_EUR } from "@/lib/format";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import { CACHE_KEYS, clearCachedData } from "@/lib/cache";
import type { Product } from "@/lib/types";

type RowState = {
  priceUah: string;
  priceEur: string;
  priceUsd: string;
  compareAtUah: string;
};

function rowFromProduct(p: Product): RowState {
  return {
    priceUah: String(p.priceNum ?? 0),
    priceEur: formatStoredForexPrice(p.priceEur),
    priceUsd: formatStoredForexPrice(p.priceUsd),
    compareAtUah:
      p.compareAtPriceNum != null && p.compareAtPriceNum > 0
        ? String(p.compareAtPriceNum)
        : "",
  };
}

function rowsEqual(a: RowState, b: RowState): boolean {
  return (
    a.priceUah === b.priceUah &&
    a.priceEur === b.priceEur &&
    a.priceUsd === b.priceUsd &&
    a.compareAtUah === b.compareAtUah
  );
}

export default function BulkPricesEditor() {
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

  function fillEurFromUah(id: string) {
    const uah = parsePriceInput(rows[id]?.priceUah ?? "");
    if (uah == null || uah <= 0) return;
    setRow(id, { priceEur: String(Math.max(1, Math.round(uah / UAH_PER_EUR))) });
  }

  async function saveAll() {
    if (!dirtyIds.length) return;
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const updates = dirtyIds.map((id) => {
        const r = rows[id];
        const priceNum = parsePriceInput(r.priceUah);
        if (priceNum == null) throw new Error(`invalid_${id}`);
        const eurRaw = r.priceEur.trim();
        const priceEur = eurRaw ? parsePriceInput(eurRaw) : null;
        const usdRaw = r.priceUsd.trim();
        const priceUsd = usdRaw ? parsePriceInput(usdRaw) : null;
        const compareRaw = r.compareAtUah.trim();
        const compareAtPriceNum = compareRaw
          ? parsePriceInput(compareRaw)
          : null;
        return {
          id,
          priceNum,
          priceEur: eurRaw === "" ? null : priceEur,
          priceUsd: usdRaw === "" ? null : priceUsd,
          compareAtPriceNum: compareRaw === "" ? null : compareAtPriceNum,
        };
      });

      const res = await fetch("/api/admin/products/prices", {
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
      setError("Не вдалося зберегти ціни — перевірте значення");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head flex-wrap gap-3">
        <div>
          <h2 className="admin-panel-title">Ціни в каталозі</h2>
          <p className="admin-panel-desc">
            {loading
              ? "Завантаження…"
              : `${products.length} товарів · змінено: ${dirtyIds.length}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            const dirty =
              initial[p.id] && !rowsEqual(r, initial[p.id]);
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

                <div className="flex flex-wrap items-end gap-3 sm:shrink-0">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Ціна, ₴
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="admin-input !h-9 !w-[100px] tabular-nums"
                      value={r.priceUah}
                      onChange={(e) =>
                        setRow(p.id, { priceUah: e.target.value })
                      }
                      onBlur={() => fillEurFromUah(p.id)}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      EUR
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="admin-input !h-9 !w-[72px] tabular-nums"
                      value={r.priceEur}
                      onChange={(e) =>
                        setRow(p.id, { priceEur: e.target.value })
                      }
                      placeholder="—"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      USD
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="admin-input !h-9 !w-[72px] tabular-nums"
                      value={r.priceUsd}
                      onChange={(e) =>
                        setRow(p.id, { priceUsd: e.target.value })
                      }
                      placeholder="—"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Було, ₴
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="admin-input !h-9 !w-[100px] tabular-nums"
                      value={r.compareAtUah}
                      onChange={(e) =>
                        setRow(p.id, { compareAtUah: e.target.value })
                      }
                      placeholder="—"
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
