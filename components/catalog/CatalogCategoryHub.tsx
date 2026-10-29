"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

type PhotoOrient = "landscape" | "portrait" | "square";

function categoryHref(lang: Locale, id: string) {
  if (id === "all") return `/${lang}/catalog?category=all`;
  return `/${lang}/catalog?category=${encodeURIComponent(id)}`;
}

function orientFromSize(w: number, h: number): PhotoOrient {
  if (!w || !h) return "square";
  const ratio = w / h;
  if (ratio > 1.12) return "landscape";
  if (ratio < 0.88) return "portrait";
  return "square";
}

/** Asymmetric collage: orientation first, index breaks ties. */
function hubCardMods(
  index: number,
  orient: PhotoOrient | undefined,
  isAll: boolean
): string[] {
  const mods: string[] = [];
  const o = orient ?? "square";
  const bump = (index * 7 + (isAll ? 3 : 0)) % 5;

  if (o === "landscape") {
    mods.push("catalog-hub-card--wide");
    if (bump === 2) mods.push("catalog-hub-card--tall");
  } else if (o === "portrait") {
    mods.push("catalog-hub-card--tall");
    if (bump === 1 || bump === 4) mods.push("catalog-hub-card--wide");
  } else {
    if (bump === 0 || bump === 3) mods.push("catalog-hub-card--tall");
    else if (bump === 1) mods.push("catalog-hub-card--wide");
  }

  if (isAll) mods.push("catalog-hub-card--all");
  return mods;
}

export default function CatalogCategoryHub({
  lang,
  categories,
}: {
  lang: Locale;
  categories: Category[];
}) {
  const { t } = useI18n();
  const [orientations, setOrientations] = useState<Record<string, PhotoOrient>>(
    {}
  );

  const noteOrient = useCallback((id: string, w: number, h: number) => {
    const next = orientFromSize(w, h);
    setOrientations((prev) => (prev[id] === next ? prev : { ...prev, [id]: next }));
  }, []);

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
    <div className="cat-shell">
      <div className="catalog-hub">
        <h1 className="cat-title catalog-hub-title">{t.catalog.title}</h1>
        <div className="catalog-hub-grid" aria-label={t.catalog.title}>
          {items.map((cat, i) => {
            const orient = orientations[cat.id];
            const className = [
              "catalog-hub-card",
              ...hubCardMods(i, orient, cat.id === "all"),
            ].join(" ");

            return (
              <Link
                key={cat.id}
                href={categoryHref(lang, cat.id)}
                className={className}
                data-orient={orient ?? "pending"}
              >
                <Image
                  src={cat.image || "/assets/hero.png"}
                  alt={cat.label[lang]}
                  fill
                  sizes="(max-width: 899px) 50vw, (max-width: 1399px) 33vw, 25vw"
                  quality={75}
                  style={{ objectFit: "cover" }}
                  onLoadingComplete={(img) =>
                    noteOrient(cat.id, img.naturalWidth, img.naturalHeight)
                  }
                />
                <span className="catalog-hub-label">{cat.label[lang]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
