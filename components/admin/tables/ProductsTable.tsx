"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Pagination from "./Pagination";
import {
  ADMIN_PRODUCTS_LIST_DEFAULT,
  adminProductsListHasParams,
  parseAdminProductsListState,
  readAdminProductsListState,
  serializeAdminProductsListState,
  writeAdminProductsListState,
  type AdminProductsListState,
  type StockFilter,
  type VisibilityFilter,
} from "@/lib/adminProductsListState";
import { getProductImageSrc } from "@/lib/getFirstProductImage";
import type { Category } from "@/lib/categories";
import type { Product } from "@/lib/types";

const PER_PAGE = 20;

function resolveInitialState(
  searchParams: URLSearchParams
): AdminProductsListState {
  if (adminProductsListHasParams(searchParams)) {
    return parseAdminProductsListState(searchParams);
  }
  return readAdminProductsListState() ?? ADMIN_PRODUCTS_LIST_DEFAULT;
}

export default function ProductsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialRef = useRef<AdminProductsListState | null>(null);
  if (!initialRef.current) {
    initialRef.current = resolveInitialState(searchParams);
  }
  const initial = initialRef.current;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(initial.q);
  const [categoryId, setCategoryId] = useState(initial.cat);
  const [stockFilter, setStockFilter] = useState<StockFilter>(initial.stock);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>(
    initial.vis
  );
  const [page, setPage] = useState(initial.page);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const categoryLabels = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.label.uk])),
    [categories]
  );

  const categoryLabel = useCallback(
    (id?: string) => {
      if (!id) return "Без категорії";
      return categoryLabels[id] ?? id;
    },
    [categoryLabels]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, catsRes] = await Promise.all([
        fetch("/api/admin/products", {
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/admin/categories", {
          credentials: "include",
          cache: "no-store",
        }),
      ]);
      if (!productsRes.ok) {
        let detail = `HTTP ${productsRes.status}`;
        try {
          const body = (await productsRes.json()) as { message?: string };
          if (body?.message) detail = body.message;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const data = (await productsRes.json()) as Product[];
      setProducts(Array.isArray(data) ? data : []);
      if (catsRes.ok) {
        const cats = (await catsRes.json()) as Category[];
        if (Array.isArray(cats)) setCategories(cats);
      }
    } catch (e) {
      console.error("Error fetching products:", e);
      const detail = e instanceof Error ? e.message : "";
      setError(
        detail
          ? `Не вдалося завантажити товари: ${detail}`
          : "Не вдалося завантажити товари"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuOpenId]);

  const counts = useMemo(() => {
    const hidden = products.filter((p) => p.isVisible === false).length;
    const out = products.filter((p) => !p.inStock).length;
    return {
      total: products.length,
      inStock: products.length - out,
      out,
      hidden,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId && p.category !== categoryId) return false;
      if (stockFilter === "in" && !p.inStock) return false;
      if (stockFilter === "out" && p.inStock) return false;
      if (visibilityFilter === "visible" && p.isVisible === false) return false;
      if (visibilityFilter === "hidden" && p.isVisible !== false) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        String(p.sku ?? "")
          .toLowerCase()
          .includes(q) ||
        categoryLabel(p.category).toLowerCase().includes(q)
      );
    });
  }, [
    products,
    search,
    categoryId,
    stockFilter,
    visibilityFilter,
    categoryLabel,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

  const listState = useMemo<AdminProductsListState>(
    () => ({
      q: search,
      cat: categoryId,
      stock: stockFilter,
      vis: visibilityFilter,
      page: currentPage,
    }),
    [search, categoryId, stockFilter, visibilityFilter, currentPage]
  );

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  // Persist filters + page (sessionStorage + URL) so edit → back keeps them.
  useEffect(() => {
    writeAdminProductsListState(listState);
    const nextQs = serializeAdminProductsListState(listState);
    const currentQs = serializeAdminProductsListState(
      parseAdminProductsListState(searchParams)
    );
    if (nextQs === currentQs) return;
    router.replace(nextQs ? `${pathname}?${nextQs}` : pathname, {
      scroll: false,
    });
  }, [listState, pathname, router, searchParams]);

  const productCategories = useMemo(
    () =>
      categories
        .filter((c) => c.kind === "category" || !c.kind)
        .sort((a, b) => a.label.uk.localeCompare(b.label.uk, "uk")),
    [categories]
  );

  async function patchProduct(
    id: string,
    patch: Partial<Pick<Product, "inStock" | "isVisible">>
  ) {
    const prev = products;
    setProducts((list) =>
      list.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const fresh = (await res.json()) as Product;
      setProducts((list) => list.map((p) => (p.id === id ? fresh : p)));
      // Drop storefront client product list so search/wishlist refetch.
      const { CACHE_KEYS, clearCachedData } = await import("@/lib/cache");
      clearCachedData(CACHE_KEYS.PRODUCTS);
    } catch (e) {
      console.error(e);
      setProducts(prev);
      alert("Не вдалося зберегти зміну");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Видалити «${product.name}»?`)) return;
    setMenuOpenId(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (e) {
      console.error("Error deleting product:", e);
      alert("Не вдалося видалити товар");
    }
  }

  async function handleDuplicate(product: Product) {
    setMenuOpenId(null);
    setBusyId(product.id);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(product.id)}/duplicate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const copy = (await res.json()) as Product;
      window.location.href = `/admin/products/${encodeURIComponent(copy.id)}/edit`;
    } catch (e) {
      console.error(e);
      alert("Не вдалося скопіювати товар");
      setBusyId(null);
    }
  }

  async function persistOrder(next: Product[]) {
    const ranked = next.map((p, i) => ({ ...p, sortOrder: i }));
    const prev = products;
    setProducts(ranked);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorder",
          ids: ranked.map((p) => p.id),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error(e);
      setProducts(prev);
      alert("Не вдалося зберегти порядок");
    }
  }

  function moveProduct(id: string, direction: -1 | 1) {
    const from = products.findIndex((p) => p.id === id);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= products.length) return;
    const next = [...products];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void persistOrder(next);
  }

  function resetFilters() {
    setSearch("");
    setCategoryId("");
    setStockFilter("all");
    setVisibilityFilter("all");
    setPage(1);
  }

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(categoryId) ||
    stockFilter !== "all" ||
    visibilityFilter !== "all";

  return (
    <div className="admin-panel" data-tour="tour-products-table">
      <div className="admin-panel-head" data-tour="tour-products-toolbar">
        <div>
          <h2 className="admin-panel-title">
            Каталог{" "}
            <span className="font-normal text-gray-400">
              ({loading ? "…" : filtered.length}
              {!loading && filtered.length !== counts.total
                ? ` з ${counts.total}`
                : ""}
              )
            </span>
          </h2>
          <p className="admin-panel-desc">
            {counts.inStock} в наявності
            {counts.out ? ` · ${counts.out} немає` : ""}
            {counts.hidden ? ` · ${counts.hidden} приховано` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="admin-btn-secondary !h-9 !px-3 !text-xs"
          title="Оновити список"
        >
          Оновити
        </button>
      </div>

      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05] sm:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Пошук: назва, ID, SKU…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="admin-input lg:max-w-sm"
          />
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="admin-input lg:w-56"
          >
            <option value="">Усі категорії</option>
            {productCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label.uk}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="admin-btn-ghost !h-9 self-start"
            >
              Скинути
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Усі"],
              ["in", "В наявності"],
              ["out", "Немає"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStockFilter(value);
                setPage(1);
              }}
              className={`admin-chip ${stockFilter === value ? "admin-chip-active" : ""}`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-gray-200 self-center sm:block dark:bg-white/10" />
          {(
            [
              ["all", "Каталог: усі"],
              ["visible", "Показані"],
              ["hidden", "Приховані"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setVisibilityFilter(value);
                setPage(1);
              }}
              className={`admin-chip ${visibilityFilter === value ? "admin-chip-active" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50/80 px-5 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void load()}
            className="admin-btn-secondary !h-8 !px-3 !text-xs"
          >
            Спробувати знову
          </button>
        </div>
      )}

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Завантаження…
          </div>
        ) : paginated.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            {hasActiveFilters
              ? "Нічого не знайдено за цими фільтрами"
              : "Товарів ще немає"}
          </div>
        ) : (
          paginated.map((p) => {
            const idx = products.findIndex((x) => x.id === p.id);
            const hidden = p.isVisible === false;
            const busy = busyId === p.id;
            return (
              <div
                key={p.id}
                className={`admin-table-row flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${
                  hidden ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-start gap-3 sm:min-w-0 sm:flex-1">
                  <div className="flex shrink-0 flex-col items-center gap-0.5 pt-1">
                    <button
                      type="button"
                      className="admin-btn-icon !h-7 !w-7 text-xs"
                      disabled={idx <= 0 || busy}
                      onClick={() => moveProduct(p.id, -1)}
                      title="Вище в каталозі"
                      aria-label="Вище"
                    >
                      ↑
                    </button>
                    <span className="tabular-nums text-[10px] font-medium text-gray-400">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      className="admin-btn-icon !h-7 !w-7 text-xs"
                      disabled={
                        idx < 0 || idx >= products.length - 1 || busy
                      }
                      onClick={() => moveProduct(p.id, 1)}
                      title="Нижче в каталозі"
                      aria-label="Нижче"
                    >
                      ↓
                    </button>
                  </div>

                  <Link
                    href={`/admin/products/${encodeURIComponent(p.id)}/edit`}
                    className="group flex min-w-0 flex-1 gap-3"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProductImageSrc(p.images)}
                      alt=""
                      className="h-[72px] w-[54px] shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-semibold text-gray-900 group-hover:underline dark:text-white">
                        {p.name}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-gray-400">
                        {p.id}
                        {p.sku != null && p.sku !== "" ? ` · SKU ${p.sku}` : ""}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                        <span>{categoryLabel(p.category)}</span>
                        <span className="text-gray-300 dark:text-gray-600">
                          ·
                        </span>
                        <span className="font-medium tabular-nums text-gray-800 dark:text-gray-200">
                          {(p.priceNum || 0).toLocaleString("uk-UA")} ₴
                        </span>
                        {p.isNew ? (
                          <span className="rounded bg-[#B7E1DF]/50 px-1.5 py-0.5 text-[10px] font-semibold text-gray-800 dark:bg-[#B7E1DF]/20 dark:text-[#B7E1DF]">
                            New
                          </span>
                        ) : null}
                        {p.isSale ? (
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                            Sale
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:shrink-0">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patchProduct(p.id, { inStock: !p.inStock })
                    }
                    className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-semibold transition ${
                      p.inStock
                        ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                    title="Перемкнути наявність"
                  >
                    {p.inStock ? "В наявності" : "Немає"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void patchProduct(p.id, {
                        isVisible: p.isVisible === false,
                      })
                    }
                    className={`inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-semibold transition ${
                      hidden
                        ? "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300"
                    }`}
                    title="Показати / приховати в каталозі"
                  >
                    {hidden ? "Приховано" : "У каталозі"}
                  </button>

                  <Link
                    href={`/admin/products/${encodeURIComponent(p.id)}/edit`}
                    className="admin-btn-secondary !h-8 !px-3 !text-xs"
                  >
                    Редагувати
                  </Link>

                  <div className="relative">
                    <button
                      type="button"
                      className="admin-btn-icon !h-8 !w-8"
                      aria-label="Ще дії"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId((cur) =>
                          cur === p.id ? null : p.id
                        );
                      }}
                    >
                      ⋯
                    </button>
                    {menuOpenId === p.id ? (
                      <div
                        className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                          onClick={() => void handleDuplicate(p)}
                        >
                          Зробити копію
                        </button>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-[13px] text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                          onClick={() => void handleDelete(p)}
                        >
                          Видалити
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <p className="text-[12px] text-gray-400">
            {(currentPage - 1) * PER_PAGE + 1}–
            {Math.min(currentPage * PER_PAGE, filtered.length)} з{" "}
            {filtered.length}
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          />
        </div>
      )}
    </div>
  );
}
