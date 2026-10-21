"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import SidebarFilter, {
  type SortOrder,
} from "@/components/layout/SidebarFilter";
import type { Category, CategoryId } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

const PAGE_STEP = 12;

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

  useEffect(() => {
    setVisibleCount(PAGE_STEP);
  }, [category, selectedSizes, selectedColors, minPrice, maxPrice, sortOrder]);

  useEffect(() => {
    if (!isFilterOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isFilterOpen]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;
  const activeFilters =
    (category !== "all" ? 1 : 0) +
    selectedSizes.length +
    selectedColors.length +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    (sortOrder !== "newest" ? 1 : 0);

  function resetFilters() {
    setSortOrder("newest");
    setSelectedSizes([]);
    setSelectedColors([]);
    setMinPrice(null);
    setMaxPrice(null);
    if (category !== "all") {
      router.push(`/${lang}/catalog`);
    }
  }

  return (
    <div className="cat-shell">
      <div className="cat-toolbar">
        <div>
          <h1 className="cat-title">{activeLabel}</h1>
          <p className="cat-count is-visible">
            {t.catalog.count(sortedProducts.length)}
          </p>
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

      {sortedProducts.length === 0 ? (
        <p className="cat-empty">{t.catalog.empty}</p>
      ) : (
        <>
          <div className="products">
            {visibleProducts.map((p, index) => (
              <ProductCard
                key={p.id}
                product={p}
                lang={lang}
                priority={index < 4}
              />
            ))}
          </div>
          {hasMore && (
            <div className="cat-more">
              <button
                type="button"
                className="cat-more-btn"
                onClick={() => setVisibleCount((n) => n + PAGE_STEP)}
              >
                {t.catalog.showMore}
              </button>
            </div>
          )}
        </>
      )}

      <SidebarFilter
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
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
