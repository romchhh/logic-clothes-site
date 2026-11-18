"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import SidebarFilter from "@/components/layout/SidebarFilter";
import type { Category } from "@/lib/categories";
import { saveCatalogState } from "@/lib/catalogState";
import { useScrollLock } from "@/hooks/useScrollLock";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SeasonFilter } from "@/lib/productSeason";

function categoryHref(lang: Locale, id: string) {
  if (id === "all") return `/${lang}/catalog?category=all`;
  return `/${lang}/catalog?category=${encodeURIComponent(id)}`;
}

/** Magazine collage slots — full-bleed, matches reference rhythm. */
const COLLAGE_SLOTS: { l: number; t: number; w: number; h: number; focus: string }[] =
  [
    { l: 0, t: 0, w: 46, h: 34, focus: "center 18%" },
    { l: 47.5, t: 0, w: 52.5, h: 42, focus: "center 22%" },
    { l: 0, t: 35, w: 100, h: 20, focus: "center 42%" },
    { l: 0, t: 56, w: 49.5, h: 22, focus: "center 28%" },
    { l: 50.5, t: 56, w: 49.5, h: 22, focus: "center 16%" },
    { l: 0, t: 79, w: 49.5, h: 21, focus: "center 20%" },
    { l: 50.5, t: 79, w: 49.5, h: 21, focus: "center 18%" },
  ];

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export default function CatalogCategoryHub({
  lang,
  categories,
  sizes = [],
  colors = [],
  priceHint = { min: 0, max: 0 },
  productCount = 0,
}: {
  lang: Locale;
  categories: Category[];
  sizes?: string[];
  colors?: string[];
  priceHint?: { min: number; max: number };
  productCount?: number;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [season, setSeason] = useState<SeasonFilter>("all");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  useScrollLock(isFilterOpen);

  const items = useMemo(() => {
    const apparel = categories.filter(
      (c) => c.kind === "category" && c.isVisible && c.id !== "all"
    );
    const base =
      apparel.length >= 2
        ? apparel
        : categories.filter((c) => c.isVisible && c.id !== "all");

    const collections = categories.filter(
      (c) =>
        c.isVisible &&
        c.id !== "all" &&
        (c.id === "new" || c.id === "sale" || c.kind === "collection")
    );

    const merged = [...base];
    for (const c of collections) {
      if (!merged.some((x) => x.id === c.id)) merged.push(c);
    }

    const allFromDb = categories.find((c) => c.id === "all");
    const allCard: Category = allFromDb ?? {
      id: "all",
      image: "/assets/products/meshdress-2_255_1.jpg",
      label: { uk: "дивитись все", en: "view all" },
      cta: { uk: t.home.seeAll, en: t.home.seeAll },
      kind: "collection",
      sortOrder: 999,
      isVisible: true,
      isSystem: true,
    };

    return [
      ...merged,
      {
        ...allCard,
        label: {
          uk: "дивитись все",
          en: allFromDb?.label.en || "view all",
        },
      },
    ];
  }, [categories, t.home.seeAll]);

  const activeFilters =
    selectedSizes.length +
    selectedColors.length +
    (season !== "all" ? 1 : 0) +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0);

  function resetFilters() {
    setSelectedSizes([]);
    setSelectedColors([]);
    setSeason("all");
    setMinPrice(null);
    setMaxPrice(null);
  }

  function applyFiltersAndBrowse() {
    saveCatalogState(lang, "all", {
      sortOrder: "newest",
      selectedSizes,
      selectedColors,
      season,
      minPrice,
      maxPrice,
      visibleCount: 16,
      scrollY: 0,
      lastProductId: null,
    });
    setIsFilterOpen(false);
    router.push(`/${lang}/catalog?category=all`);
  }

  if (!items.length) return null;

  const groups = chunk(items, COLLAGE_SLOTS.length);

  return (
    <div className="cat-shell catalog-hub-shell">
      <div className="cat-toolbar catalog-hub-toolbar">
        <h1 className="cat-title">{t.catalog.title}</h1>
        <div className="cat-toolbar-actions">
          <button
            type="button"
            className={`cat-filter-btn${activeFilters > 0 ? " has-active" : ""}`}
            onClick={() => setIsFilterOpen(true)}
          >
            {t.catalog.filters}
            {activeFilters > 0 ? (
              <span className="cat-filter-badge">{activeFilters}</span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Duplicating text list — before photos, as on the reference */}
      <nav className="catalog-hub-list" aria-label={t.catalog.category}>
        {items.map((cat) => (
          <Link
            key={`list-${cat.id}`}
            href={categoryHref(lang, cat.id)}
            className="catalog-hub-list-link"
          >
            {cat.label[lang]}
          </Link>
        ))}
      </nav>

      <div className="catalog-hub">
        {groups.map((group, gi) => {
          const bottom = Math.max(
            ...group.map((_, i) => {
              const slot = COLLAGE_SLOTS[i];
              return slot.t + slot.h;
            })
          );
          return (
            <div
              key={gi}
              className="catalog-hub-canvas"
              style={{ aspectRatio: `100 / ${bottom}` }}
              aria-label={t.catalog.title}
            >
              {group.map((cat, i) => {
                const slot = COLLAGE_SLOTS[i] ?? COLLAGE_SLOTS[COLLAGE_SLOTS.length - 1];
                return (
                  <Link
                    key={cat.id}
                    href={categoryHref(lang, cat.id)}
                    className={`catalog-hub-card${cat.id === "all" ? " catalog-hub-card--all" : ""}`}
                    style={{
                      left: `${slot.l}%`,
                      top: `${slot.t}%`,
                      width: `${slot.w}%`,
                      height: `${slot.h}%`,
                    }}
                  >
                    <Image
                      src={cat.image || "/assets/hero.png"}
                      alt={cat.label[lang]}
                      fill
                      sizes="100vw"
                      quality={85}
                      style={{ objectFit: "cover", objectPosition: slot.focus }}
                    />
                    <span className="catalog-hub-label">{cat.label[lang]}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <SidebarFilter
        isOpen={isFilterOpen}
        onClose={() => {
          if (activeFilters > 0) {
            applyFiltersAndBrowse();
            return;
          }
          setIsFilterOpen(false);
        }}
        openAccordion={openAccordion}
        setOpenAccordion={setOpenAccordion}
        selectedSizes={selectedSizes}
        setSelectedSizes={setSelectedSizes}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
        season={season}
        setSeason={setSeason}
        minPrice={minPrice}
        maxPrice={maxPrice}
        setMinPrice={setMinPrice}
        setMaxPrice={setMaxPrice}
        sizes={sizes}
        colors={colors}
        priceHint={priceHint}
        category="all"
        categories={categories}
        lang={lang}
        onReset={resetFilters}
        resultCount={productCount}
      />
    </div>
  );
}
