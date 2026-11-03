"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

function categoryHref(lang: Locale, id: string) {
  if (id === "all") return `/${lang}/catalog?category=all`;
  return `/${lang}/catalog?category=${encodeURIComponent(id)}`;
}

/** Positions measured from the catalog collage reference (382×959). */
const COLLAGE_SLOTS: { l: number; t: number; w: number; h: number; focus: string }[] =
  [
    { l: 16.23, t: 0, w: 45.03, h: 19.92, focus: "center 18%" },
    { l: 61.78, t: 6.47, w: 34.82, h: 14.91, focus: "center 22%" },
    { l: 10.21, t: 21.48, w: 87.44, h: 17.21, focus: "center 42%" },
    { l: 1.57, t: 39.1, w: 37.96, h: 36.39, focus: "center 28%" },
    { l: 41.1, t: 39.0, w: 47.12, h: 20.75, focus: "center 16%" },
    { l: 40.84, t: 59.85, w: 59.16, h: 25.76, focus: "center 20%" },
    { l: 0, t: 76.64, w: 39.53, h: 18.04, focus: "center 18%" },
    { l: 42.15, t: 85.92, w: 52.36, h: 14.08, focus: "center 30%" },
  ];

const COLLAGE_W = 382;
const COLLAGE_H = 959;

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

export default function CatalogCategoryHub({
  lang,
  categories,
}: {
  lang: Locale;
  categories: Category[];
}) {
  const { t } = useI18n();

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
      label: { uk: "Усі товари", en: "All products" },
      cta: { uk: t.home.seeAll, en: t.home.seeAll },
      kind: "collection",
      sortOrder: 999,
      isVisible: true,
      isSystem: true,
    };

    return [...merged, allCard];
  }, [categories, t.home.seeAll]);

  if (!items.length) return null;

  const groups = chunk(items, COLLAGE_SLOTS.length);

  return (
    <div className="cat-shell catalog-hub-shell">
      <div className="catalog-hub">
        <h1 className="catalog-hub-title">{t.catalog.title}</h1>
        {groups.map((group, gi) => {
          const bottom = Math.max(
            ...group.map((_, i) => {
              const slot = COLLAGE_SLOTS[i];
              return slot.t + slot.h;
            })
          );
          const ratio = COLLAGE_W / (COLLAGE_H * (bottom / 100));
          return (
            <div
              key={gi}
              className="catalog-hub-canvas"
              style={{ aspectRatio: String(ratio) }}
              aria-label={t.catalog.title}
            >
              {group.map((cat, i) => {
                const slot = COLLAGE_SLOTS[i];
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
                      sizes="240px"
                      quality={80}
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
    </div>
  );
}
