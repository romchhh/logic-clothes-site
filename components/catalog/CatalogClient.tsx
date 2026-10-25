"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ProductCard from "@/components/catalog/ProductCard";
import SidebarFilter, {
  type SortOrder,
} from "@/components/layout/SidebarFilter";
import type { Category, CategoryId } from "@/lib/categories";
import {
  clearCatalogState,
  loadCatalogState,
  rememberCatalogExit,
  saveCatalogState,
} from "@/lib/catalogState";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

const PAGE_STEP = 16;

export default function CatalogClient({
  products,
  category,
  categories,
  sizes,
  colors,
  priceHint,
  lang,
}: {
  products: Product[];
  category: CategoryId;
  categories: Category[];
  sizes: string[];
  colors: string[];
  priceHint: { min: number; max: number };
  lang: Locale;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [ready, setReady] = useState(false);
  const pendingScrollY = useRef(0);
  const pendingProductId = useRef<string | null>(null);
  const restoreDoneRef = useRef(false);
  const filterKeyRef = useRef<string | null>(null);
  const persistRef = useRef({
    sortOrder,
    selectedSizes,
    selectedColors,
    minPrice,
    maxPrice,
    visibleCount,
    lastProductId: null as string | null,
  });

  persistRef.current = {
    sortOrder,
    selectedSizes,
    selectedColors,
    minPrice,
    maxPrice,
    visibleCount,
    lastProductId: persistRef.current.lastProductId,
  };

  const activeLabel =
    categories.find((c) => c.id === category)?.label[lang] || t.catalog.title;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSize =
        selectedSizes.length === 0 ||
        (product.sizeOptions || []).some((s) => selectedSizes.includes(s));

      const colorValues = [
        product.color,
        ...(product.swatches || []).map((s) => s.label),
      ].filter(Boolean) as string[];

      const matchesColor =
        selectedColors.length === 0 ||
        selectedColors.some((c) => colorValues.includes(c));

      const price = Number(product.priceNum) || 0;
      const matchesMin = minPrice == null || price >= minPrice;
      const matchesMax = maxPrice == null || price <= maxPrice;

      return matchesSize && matchesColor && matchesMin && matchesMax;
    });
  }, [products, selectedSizes, selectedColors, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortOrder === "newest") {
      return list.sort((a, b) => {
        if (Boolean(a.isNew) !== Boolean(b.isNew)) {
          return a.isNew ? -1 : 1;
        }
        const sa = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const sb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (sa !== sb) return sa - sb;
        return a.id.localeCompare(b.id);
      });
    }
    return list.sort((a, b) => {
      const pa = Number(a.priceNum) || 0;
      const pb = Number(b.priceNum) || 0;
      return sortOrder === "asc" ? pa - pb : pb - pa;
    });
  }, [filteredProducts, sortOrder]);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        category,
        sortOrder,
        selectedSizes,
        selectedColors,
        minPrice,
        maxPrice,
      }),
    [category, sortOrder, selectedSizes, selectedColors, minPrice, maxPrice]
  );

  // Restore filters + scroll after back-navigation from a product page.
  useLayoutEffect(() => {
    restoreDoneRef.current = false;
    const saved = loadCatalogState(lang, category);
    if (saved) {
      setSortOrder(saved.sortOrder);
      setSelectedSizes(saved.selectedSizes);
      setSelectedColors(saved.selectedColors);
      setMinPrice(saved.minPrice);
      setMaxPrice(saved.maxPrice);
      setVisibleCount(saved.visibleCount);
      pendingScrollY.current = saved.scrollY;
      pendingProductId.current = saved.lastProductId;
      persistRef.current.lastProductId = saved.lastProductId;
    } else {
      pendingScrollY.current = 0;
      pendingProductId.current = null;
      persistRef.current.lastProductId = null;
    }
    filterKeyRef.current = null;
    setReady(true);

    try {
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }
    } catch {
      /* ignore */
    }

    return () => {
      try {
        if ("scrollRestoration" in history) {
          history.scrollRestoration = "auto";
        }
      } catch {
        /* ignore */
      }
    };
  }, [lang, category]);

  useLayoutEffect(() => {
    if (!ready || restoreDoneRef.current) return;
    const y = pendingScrollY.current;
    const productId = pendingProductId.current;
    if (y <= 0 && !productId) {
      restoreDoneRef.current = true;
      return;
    }

    const apply = () => {
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";

      if (productId) {
        const el = document.querySelector<HTMLElement>(
          `[data-product-id="${CSS.escape(productId)}"]`
        );
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" });
          html.style.scrollBehavior = prev;
          return true;
        }
      }

      if (y > 0) {
        window.scrollTo({ top: y, left: 0, behavior: "instant" });
        if (Math.abs((window.scrollY || 0) - y) > 2) {
          window.scrollTo(0, y);
        }
      }
      html.style.scrollBehavior = prev;
      return y <= 0 || !productId;
    };

    // Prefer product node once the restored batch is in the DOM.
    const applied = apply();
    if (applied && (!productId || document.querySelector(`[data-product-id="${CSS.escape(productId)}"]`))) {
      restoreDoneRef.current = true;
      pendingScrollY.current = 0;
      pendingProductId.current = null;
    }

    const timers = [
      window.setTimeout(() => {
        if (apply()) {
          restoreDoneRef.current = true;
          pendingScrollY.current = 0;
          pendingProductId.current = null;
        }
      }, 50),
      window.setTimeout(() => {
        apply();
        restoreDoneRef.current = true;
        pendingScrollY.current = 0;
        pendingProductId.current = null;
      }, 250),
    ];
    const raf = window.requestAnimationFrame(() => apply());

    return () => {
      window.cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [ready, sortedProducts.length, visibleCount]);

  useEffect(() => {
    if (!ready) return;
    if (filterKeyRef.current === null) {
      filterKeyRef.current = filterKey;
      return;
    }
    if (filterKeyRef.current !== filterKey) {
      filterKeyRef.current = filterKey;
      // User changed filters — don't wipe restore mid-flight.
      if (!restoreDoneRef.current && pendingScrollY.current > 0) return;
      setVisibleCount(PAGE_STEP);
      pendingProductId.current = null;
      persistRef.current.lastProductId = null;
    }
  }, [filterKey, ready]);

  useEffect(() => {
    if (!ready) return;
    const persist = () => {
      const cur = persistRef.current;
      saveCatalogState(lang, category, {
        sortOrder: cur.sortOrder,
        selectedSizes: cur.selectedSizes,
        selectedColors: cur.selectedColors,
        minPrice: cur.minPrice,
        maxPrice: cur.maxPrice,
        visibleCount: cur.visibleCount,
        scrollY: window.scrollY || 0,
        lastProductId: cur.lastProductId,
      });
    };
    persist();
    const onScroll = () => persist();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", persist);
    return () => {
      persist();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [
    ready,
    lang,
    category,
    sortOrder,
    selectedSizes,
    selectedColors,
    minPrice,
    maxPrice,
    visibleCount,
  ]);

  function rememberProductExit(productId: string) {
    persistRef.current.lastProductId = productId;
    rememberCatalogExit(lang, category, {
      ...persistRef.current,
      lastProductId: productId,
      scrollY: window.scrollY || 0,
    });
  }

  useScrollLock(isFilterOpen);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    setVisibleCount((n) => {
      if (n >= sortedProducts.length) return n;
      return Math.min(n + PAGE_STEP, sortedProducts.length);
    });
  }, [sortedProducts.length]);

  // Infinite scroll: load next batch when the sentinel enters the viewport.
  useEffect(() => {
    if (!ready || !hasMore) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      { root: null, rootMargin: "480px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ready, hasMore, loadMore, visibleCount]);

  const activeFilters =
    (category !== "all" ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0);

  function resetFilters() {
    setSortOrder("newest");
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice(null);
    setMaxPrice(null);
    setVisibleCount(PAGE_STEP);
    clearCatalogState(lang, category);
    if (category !== "all") {
      router.push(`/${lang}/catalog`);
    }
  }

  return (
    <div className="cat-shell">
      <div className="cat-toolbar">
        <div>
          <h1 className="cat-title">{activeLabel}</h1>
        </div>
        <div className="cat-toolbar-actions">
          <div className="cat-sort" role="group" aria-label={t.catalog.price}>
            <span className="cat-sort-prefix">{t.catalog.price}</span>
            <button
              type="button"
              className={`cat-sort-arrow${sortOrder === "asc" ? " is-active" : ""}`}
              aria-label={t.catalog.sortAsc}
              aria-pressed={sortOrder === "asc"}
              onClick={() => setSortOrder("asc")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              className={`cat-sort-arrow${sortOrder === "desc" ? " is-active" : ""}`}
              aria-label={t.catalog.sortDesc}
              aria-pressed={sortOrder === "desc"}
              onClick={() => setSortOrder("desc")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            className={`cat-filter-btn${activeFilters > 0 ? " has-active" : ""}`}
            onClick={() => setIsFilterOpen(true)}
          >
            {t.catalog.filters}
            {activeFilters > 0 && (
              <span className="cat-filter-badge">{activeFilters}</span>
            )}
          </button>
        </div>
      </div>

      {sortedProducts.length === 0 ? (
        <p className="cat-empty">{t.catalog.empty}</p>
      ) : (
        <>
          <div
            className="products"
            onClickCapture={(e) => {
              const target = e.target as HTMLElement | null;
              const card = target?.closest<HTMLElement>("[data-product-id]");
              const id = card?.dataset.productId;
              if (!id) return;
              // Ignore wishlist button inside the card.
              if (target?.closest("button.wish")) return;
              rememberProductExit(id);
            }}
          >
            {visibleProducts.map((p, index) => (
              <ProductCard
                key={p.id}
                product={p}
                lang={lang}
                priority={index < 4}
              />
            ))}
          </div>
          {hasMore ? (
            <div
              ref={loadMoreRef}
              className="cat-more-sentinel"
              aria-hidden="true"
            />
          ) : null}
        </>
      )}

      <SidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        sizes={sizes}
        colors={colors}
        priceHint={priceHint}
        category={category}
        categories={categories}
        lang={lang}
        onReset={resetFilters}
        resultCount={sortedProducts.length}
      />
    </div>
  );
}
