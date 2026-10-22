"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

function categoryHref(lang: Locale, id: string) {
  if (id === "all") return `/${lang}/catalog`;
  return `/${lang}/catalog?category=${id}`;
}

export default function HeroCategories({
  lang,
  categories,
}: {
  lang: Locale;
  categories: Category[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const items = useMemo(() => {
    const t = getMessages(lang);
    const apparel = categories.filter(
      (c) => c.kind === "category" && c.isVisible && c.id !== "all"
    );
    const base =
      apparel.length >= 2
        ? apparel
        : categories.filter((c) => c.isVisible && c.id !== "all");

    const allFromDb = categories.find((c) => c.id === "all");
    const allCard: Category = allFromDb ?? {
      id: "all",
      image: "/assets/products/meshdress-2_255_1.jpg",
      label: {
        uk: "Усі товари",
        en: "All products",
      },
      cta: { uk: t.home.seeAll, en: t.home.seeAll },
      kind: "collection",
      sortOrder: 999,
      isVisible: true,
      isSystem: true,
    };

    return [...base, allCard];
  }, [categories, lang]);

  const count = items.length;

  const scrollToIndex = useCallback(
    (domIndex: number, behavior: ScrollBehavior = "smooth") => {
      const el = trackRef.current;
      if (!el) return;
      const cards = el.querySelectorAll<HTMLElement>(".hero-cat-card");
      const card = cards[domIndex];
      if (!card) return;
      const left = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
      el.scrollTo({ left, behavior });
    },
    []
  );

  const pickActiveIndex = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const cards = el.querySelectorAll<HTMLElement>(".hero-cat-card");
    if (!cards.length) return;

    const centerX = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    if (best !== activeRef.current) {
      activeRef.current = best;
      setActiveIndex(best);
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      pickActiveIndex();
    });
  }, [pickActiveIndex]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !items.length) return;

    const onScroll = () => scheduleSync();
    const onScrollEnd = () => pickActiveIndex();

    requestAnimationFrame(() => {
      scrollToIndex(0, "auto");
      setReady(true);
      pickActiveIndex();
    });

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", onScrollEnd);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", onScrollEnd);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [items.length, count, scrollToIndex, pickActiveIndex, scheduleSync]);

  function scrollBy(dir: -1 | 1) {
    const next = Math.min(count - 1, Math.max(0, activeRef.current + dir));
    scrollToIndex(next, "smooth");
  }

  if (!items.length) return null;

  return (
    <div className="hero-cats">
      <button
        type="button"
        className="hero-cats-arrow hero-cats-arrow--prev"
        aria-label={lang === "uk" ? "Назад" : "Previous"}
        onClick={() => scrollBy(-1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div
        className={`hero-cat-track${ready ? " is-ready" : ""}`}
        ref={trackRef}
        aria-label={lang === "uk" ? "Категорії" : "Categories"}
      >
        {items.map((cat, i) => {
          const isCenter = i === activeIndex;
          const isAll = cat.id === "all";
          return (
            <Link
              key={`${cat.id}-${i}`}
              href={categoryHref(lang, cat.id)}
              className={[
                "hero-cat-card",
                isCenter ? "is-center" : "",
                isAll ? "hero-cat-card--all" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={isCenter ? "true" : undefined}
            >
              <Image
                src={cat.image || "/assets/hero.png"}
                alt={cat.label[lang]}
                fill
                sizes="(max-width: 768px) 36vw, 230px"
                quality={70}
                loading={isCenter ? "eager" : "lazy"}
                style={{ objectFit: "cover" }}
              />
              <span className="hero-cat-label">
                {isAll
                  ? lang === "uk"
                    ? "Усі товари"
                    : "All products"
                  : cat.label[lang]}
              </span>
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        className="hero-cats-arrow hero-cats-arrow--next"
        aria-label={lang === "uk" ? "Далі" : "Next"}
        onClick={() => scrollBy(1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
