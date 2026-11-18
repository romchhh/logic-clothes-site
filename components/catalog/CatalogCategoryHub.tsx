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

type CollageSlot = {
  l: number;
  t: number;
  w: number;
  h: number;
  focus: string;
  z?: number;
};

/**
 * Irregular magazine collage (same on mobile and desktop):
 * tall photo on the right, shorter one tucked under the category column,
 * a full-bleed strip, then two bottom frames that don't share one baseline.
 */
const COLLAGE_SLOTS: CollageSlot[] = [
  { l: 39.2, t: 0, w: 60.8, h: 56.4, focus: "center 20%", z: 1 },
  { l: 0, t: 36.8, w: 37.4, h: 21.6, focus: "center 34%", z: 2 },
  { l: 0, t: 57.2, w: 100, h: 14.6, focus: "center 44%", z: 1 },
  { l: 0, t: 72.8, w: 47.6, h: 27.2, focus: "center 26%", z: 1 },
  { l: 49.1, t: 73.9, w: 50.9, h: 26.1, focus: "center 16%", z: 2 },
];

/** Next screens stay staggered — not a second even grid. */
const COLLAGE_SLOTS_MORE: CollageSlot[] = [
  { l: 0, t: 0, w: 44.5, h: 44, focus: "center 24%", z: 1 },
  { l: 46.2, t: 4.2, w: 53.8, h: 48.5, focus: "center 18%", z: 2 },
  { l: 0, t: 51.2, w: 100, h: 16.4, focus: "center 40%", z: 1 },
  { l: 0, t: 68.6, w: 51.4, h: 31.4, focus: "center 28%", z: 1 },
  { l: 53, t: 70.2, w: 47, h: 29.8, focus: "center 20%", z: 2 },
];

function chunkCollage(
  list: Category[],
  heroSlots: CollageSlot[]
): { group: Category[]; slots: CollageSlot[] }[] {
  if (!list.length) return [];
  const out: { group: Category[]; slots: CollageSlot[] }[] = [];
  let i = 0;
  const first = list.slice(0, heroSlots.length);
  if (first.length) {
    out.push({ group: first, slots: heroSlots });
    i = first.length;
  }
  while (i < list.length) {
    const slice = list.slice(i, i + COLLAGE_SLOTS_MORE.length);
    out.push({ group: slice, slots: COLLAGE_SLOTS_MORE });
    i += slice.length;
  }
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

  const groups = chunkCollage(items, COLLAGE_SLOTS);

  const navMarkup = (
    <>
      {items.map((cat) => (
        <Link
          key={`nav-${cat.id}`}
          href={categoryHref(lang, cat.id)}
          className="catalog-hub-nav-link"
        >
          {cat.label[lang]}
        </Link>
      ))}
    </>
  );

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

      <div className="catalog-hub">
          {groups.map(({ group, slots }, gi) => {
            const bottom = Math.max(
              ...group.map((_, i) => {
                const slot = slots[i] ?? slots[slots.length - 1];
                return slot.t + slot.h;
              })
            );
            return (
              <div
                key={gi}
                className={`catalog-hub-canvas${gi === 0 ? " catalog-hub-canvas--hero" : ""}`}
                style={{ aspectRatio: `100 / ${bottom}` }}
                aria-label={t.catalog.title}
              >
                {gi === 0 ? (
                  <nav
                    className="catalog-hub-nav catalog-hub-nav--overlay"
                    aria-label={t.catalog.category}
                  >
                    {navMarkup}
                  </nav>
                ) : null}
                {group.map((cat, i) => {
                  const slot = slots[i] ?? slots[slots.length - 1];
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
                        zIndex: slot.z ?? 1,
                      }}
                    >
                      <Image
                        src={cat.image || "/assets/hero.png"}
                        alt={cat.label[lang]}
                        fill
                        sizes="100vw"
                        quality={85}
                        style={{
                          objectFit: "cover",
                          objectPosition: slot.focus,
                        }}
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
