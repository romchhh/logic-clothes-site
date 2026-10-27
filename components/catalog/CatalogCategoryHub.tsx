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

  return (
    <div className="catalog-hub">
      <h1 className="cat-title catalog-hub-title">{t.catalog.title}</h1>
      <div className="catalog-hub-grid" aria-label={t.catalog.title}>
        {items.map((cat, i) => {
          const tall = i % 5 === 0 || i % 5 === 3;
          const wide = i % 5 === 1;
          return (
            <Link
              key={cat.id}
              href={categoryHref(lang, cat.id)}
              className={[
                "catalog-hub-card",
                tall ? "catalog-hub-card--tall" : "",
                wide ? "catalog-hub-card--wide" : "",
                cat.id === "all" ? "catalog-hub-card--all" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <Image
                src={cat.image || "/assets/hero.png"}
                alt={cat.label[lang]}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                quality={75}
                style={{ objectFit: "cover" }}
              />
              <span className="catalog-hub-label">{cat.label[lang]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
