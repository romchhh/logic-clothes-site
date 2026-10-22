"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Product } from "@/lib/types";

export default function ProductRail({
  title,
  titleId,
  products,
  lang,
  seeAllHref,
  priorityCount = 0,
}: {
  title: string;
  titleId: string;
  products: Product[];
  lang: Locale;
  seeAllHref?: string;
  priorityCount?: number;
}) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const showNav = products.length > 1;

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [products.length]);

  if (!products.length) return null;

  function scrollBy(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 420);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <section className="home-section home-rail" aria-labelledby={titleId}>
      <div className="section-head">
        <h2 id={titleId}>{title}</h2>
        <div className="home-rail-actions">
          {seeAllHref && (
            <Link href={seeAllHref} className="home-rail-all">
              {t.home.seeAll}
            </Link>
          )}
          {showNav && (
            <div className="cat-nav">
              <button
                type="button"
                aria-label={lang === "uk" ? "Назад" : "Previous"}
                onClick={() => scrollBy(-1)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={lang === "uk" ? "Далі" : "Next"}
                onClick={() => scrollBy(1)}
              >
                <svg viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="home-rail-track" ref={trackRef}>
        {products.map((p, index) => (
          <div className="home-rail-item" key={p.id}>
            <ProductCard
              product={p}
              lang={lang}
              priority={index < priorityCount}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
