"use client";

import Link from "next/link";
import PriceRangeFilter from "@/components/catalog/PriceRangeFilter";
import type { Category, CategoryId } from "@/lib/categories";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import {
  categorySupportsSeasonFilter,
  type SeasonFilter,
} from "@/lib/productSeason";
import { formatSizeLabel } from "@/lib/productSizes";

export type SortOrder = "newest" | "oldest" | "asc" | "desc";

interface SidebarFilterProps {
  isOpen: boolean;
  onClose: () => void;
  openAccordion: number | null;
  setOpenAccordion: (index: number | null) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[] | ((prev: string[]) => string[])) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[] | ((prev: string[]) => string[])) => void;
  season: SeasonFilter;
  setSeason: (v: SeasonFilter) => void;
  minPrice: number | null;
  maxPrice: number | null;
  setMinPrice: (v: number | null) => void;
  setMaxPrice: (v: number | null) => void;
  sizes: string[];
  colors: string[];
  priceHint: { min: number; max: number };
  category: CategoryId;
  categories: Category[];
  lang: Locale;
  onReset: () => void;
  resultCount: number;
}

export default function SidebarFilter({
  isOpen,
  onClose,
  openAccordion,
  setOpenAccordion,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  season,
  setSeason,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  sizes,
  colors,
  priceHint,
  category,
  categories,
  lang,
  onReset,
  resultCount,
}: SidebarFilterProps) {
  const { t } = useI18n();
  const showSeason = categorySupportsSeasonFilter(category, categories);

  function toggleAccordion(index: number) {
    setOpenAccordion(openAccordion === index ? null : index);
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }

  return (
    <>
      <div
        className={`panel-backdrop${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`side-panel side-panel--filter${isOpen ? " open" : ""}`}
        aria-label={t.catalog.filters}
        aria-hidden={!isOpen}
      >
        <div className="side-panel-head">
          <h2>{t.catalog.filters}</h2>
          <button type="button" onClick={onClose} aria-label={t.a11y.close}>
            ×
          </button>
        </div>

        {showSeason ? (
          <div className="filter-season-bar" role="group" aria-label={t.catalog.season}>
            <p className="filter-season-label">{t.catalog.season}</p>
            <div className="filter-season-chips">
              {(
                [
                  { id: "all", label: t.catalog.seasonAll },
                  { id: "summer", label: t.catalog.seasonWarm },
                  { id: "winter", label: t.catalog.seasonCold },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`filter-season-chip${
                    season === opt.id ? " is-active" : ""
                  }`}
                  onClick={() => setSeason(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="side-panel-body filter-body">
          <div className="filter-acc">
            <button
              type="button"
              className="filter-acc-head"
              aria-expanded={openAccordion === 0}
              onClick={() => toggleAccordion(0)}
            >
              <span>{t.catalog.category}</span>
              <span aria-hidden="true">{openAccordion === 0 ? "−" : "+"}</span>
            </button>
            {openAccordion === 0 && (
              <div className="filter-acc-body">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={
                      cat.id === "all"
                        ? `/${lang}/catalog?category=all`
                        : `/${lang}/catalog?category=${cat.id}`
                    }
                    className={`filter-option${category === cat.id ? " is-active" : ""}`}
                    onClick={onClose}
                  >
                    {cat.label[lang]}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {sizes.length > 0 && (
            <div className="filter-acc">
              <button
                type="button"
                className="filter-acc-head"
                aria-expanded={openAccordion === 1}
                onClick={() => toggleAccordion(1)}
              >
                <span>{t.catalog.size}</span>
                <span aria-hidden="true">{openAccordion === 1 ? "−" : "+"}</span>
              </button>
              {openAccordion === 1 && (
                <div className="filter-acc-body filter-checks">
                  {sizes.map((size) => (
                    <label key={size} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                      />
                      <span>{formatSizeLabel(size)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {colors.length > 0 && (
            <div className="filter-acc">
              <button
                type="button"
                className="filter-acc-head"
                aria-expanded={openAccordion === 2}
                onClick={() => toggleAccordion(2)}
              >
                <span>{t.catalog.color}</span>
                <span aria-hidden="true">{openAccordion === 2 ? "−" : "+"}</span>
              </button>
              {openAccordion === 2 && (
                <div className="filter-acc-body filter-checks">
                  {colors.map((color) => (
                    <label key={color} className="filter-check">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => toggleColor(color)}
                      />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="filter-acc">
            <button
              type="button"
              className="filter-acc-head"
              aria-expanded={openAccordion === 3}
              onClick={() => toggleAccordion(3)}
            >
              <span>{t.catalog.price}</span>
              <span aria-hidden="true">{openAccordion === 3 ? "−" : "+"}</span>
            </button>
            {openAccordion === 3 && (
              <div className="filter-acc-body filter-price">
                <PriceRangeFilter
                  bounds={priceHint}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  setMinPrice={setMinPrice}
                  setMaxPrice={setMaxPrice}
                />
              </div>
            )}
          </div>
        </div>

        <div className="side-panel-foot filter-foot">
          <button type="button" className="filter-reset" onClick={onReset}>
            {t.catalog.reset}
          </button>
          <button type="button" className="btn-brand" onClick={onClose}>
            {t.catalog.count(resultCount)}
          </button>
        </div>
      </aside>
    </>
  );
}
