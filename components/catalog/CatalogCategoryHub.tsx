"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
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
 * Phone-reference frame: collage is taller than the viewport width
 * (measured 471×890). Same percentages on mobile and desktop.
 */
const COLLAGE_FRAME = 189;

/**
 * Five cards, traced from the reference:
 * tall photo on the right, shorter one under the category list,
 * an inset wide strip, then two bottom photos that stop before the right edge.
 */
const COLLAGE_SLOTS: CollageSlot[] = [
  { l: 43.5, t: 0, w: 55, h: 54, focus: "center 18%", z: 1 },
  { l: 6.8, t: 21.3, w: 35.2, h: 35, focus: "center 30%", z: 2 },
  { l: 14.9, t: 55.1, w: 79.2, h: 19.6, focus: "center 42%", z: 1 },
  { l: 6.8, t: 75.1, w: 34.8, h: 24.7, focus: "center 28%", z: 1 },
  { l: 42.9, t: 75.1, w: 42.9, h: 24.7, focus: "center 16%", z: 1 },
];

/** Later categories keep the same staggered frame, not an even grid. */
const COLLAGE_SLOTS_MORE: CollageSlot[] = [
  { l: 43.5, t: 0, w: 55, h: 52, focus: "center 20%", z: 1 },
  { l: 6.8, t: 18, w: 35.2, h: 36, focus: "center 32%", z: 2 },
  { l: 14.9, t: 53, w: 79.2, h: 18, focus: "center 40%", z: 1 },
  { l: 6.8, t: 73, w: 34.8, h: 26, focus: "center 26%", z: 1 },
  { l: 42.9, t: 73, w: 42.9, h: 26, focus: "center 18%", z: 1 },
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
  const heroCanvasRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
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

  useLayoutEffect(() => {
    const canvas = heroCanvasRef.current;
    const nav = navRef.current;
    if (!canvas || !nav) return;
    const place = () => {
      const gap = 16;
      const top = nav.offsetTop + nav.offsetHeight + gap;
      canvas.style.setProperty("--tuck-top", `${top}px`);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [items, lang]);

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
            return (
              <div
                key={gi}
                ref={gi === 0 ? heroCanvasRef : undefined}
                className={`catalog-hub-canvas${gi === 0 ? " catalog-hub-canvas--hero" : ""}`}
                style={{ aspectRatio: `100 / ${COLLAGE_FRAME}` }}
                aria-label={t.catalog.title}
              >
                {gi === 0 ? (
                  <nav
                    ref={navRef}
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
                      className={`catalog-hub-card${cat.id === "all" ? " catalog-hub-card--all" : ""}${gi === 0 && i === 1 ? " catalog-hub-card--tuck" : ""}`}
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
