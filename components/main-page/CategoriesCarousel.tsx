"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

const LOOP_COPIES = 3;

export default function CategoriesCarousel({
  lang,
  categories,
}: {
  lang: Locale;
  categories: Category[];
}) {
  const { t } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const loopingRef = useRef(false);
  const [activeLogical, setActiveLogical] = useState(0);
  const [ready, setReady] = useState(false);

  const looped = useMemo(
    () =>
      Array.from({ length: categories.length < 2 ? 1 : LOOP_COPIES }, (_, copy) =>
        categories.map((cat) => ({ cat, copy }))
      ).flat(),
    [categories]
  );

  const count = categories.length;
  const canLoop = count >= 2;

  const scrollToIndex = useCallback(
    (domIndex: number, behavior: ScrollBehavior = "smooth") => {
      const el = trackRef.current;
      if (!el) return;
      const cards = el.querySelectorAll<HTMLElement>(".cat-card");
      const card = cards[domIndex];
      if (!card) return;
      const left =
        card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
      el.scrollTo({ left, behavior });
    },
    []
  );

  const syncActive = useCallback(() => {
    const el = trackRef.current;
    if (!el || loopingRef.current) return;

    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    if (!cards.length) return;

    const trackRect = el.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    let best = 0;
    let bestDist = Infinity;

    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const cardCenter = r.left + r.width / 2;
      const dist = Math.abs(cardCenter - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    if (canLoop) {
      setActiveLogical(((best % count) + count) % count);

      const middleStart = count;
      const middleEnd = count * 2;
      if (best < middleStart || best >= middleEnd) {
        loopingRef.current = true;
        const target = middleStart + (best % count);
        scrollToIndex(target, "auto");
        requestAnimationFrame(() => {
          loopingRef.current = false;
        });
      }
    } else {
      setActiveLogical(best);
    }
  }, [canLoop, count, scrollToIndex]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !categories.length) return;

    const start = canLoop ? count : 0;
    requestAnimationFrame(() => {
      scrollToIndex(start, "auto");
      setReady(true);
      syncActive();
    });

    el.addEventListener("scroll", syncActive, { passive: true });
    window.addEventListener("resize", syncActive);
    return () => {
      el.removeEventListener("scroll", syncActive);
      window.removeEventListener("resize", syncActive);
    };
  }, [categories.length, canLoop, count, scrollToIndex, syncActive]);

  function scrollBy(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(".cat-card");
    const trackRect = el.getBoundingClientRect();
    const centerX = trackRect.left + trackRect.width / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const dist = Math.abs(r.left + r.width / 2 - centerX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });

    let next = best + dir;
    if (canLoop) {
      if (next < 0) next = cards.length - 1;
      if (next >= cards.length) next = 0;
    } else {
      next = Math.min(cards.length - 1, Math.max(0, next));
    }
    scrollToIndex(next, "smooth");
  }

  return (
    <section className="home-section home-cats" aria-labelledby="cats-title">
      <div className="section-head">
        <h2 id="cats-title" className="home-cats-title">
          {t.home.categories}
        </h2>
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
      </div>

      <div
        className={`cat-track${ready ? " is-ready" : ""}`}
        ref={trackRef}
      >
        {looped.map(({ cat, copy }, i) => {
          const logical = canLoop ? i % count : i;
          return (
            <Link
              key={`${cat.id}-${copy}-${i}`}
              href={
                cat.id === "all"
                  ? `/${lang}/catalog`
                  : `/${lang}/catalog?category=${cat.id}`
              }
              className={`cat-card${logical === activeLogical ? " is-center" : ""}`}
            >
              <Image
                src={cat.image}
                alt={cat.label[lang]}
                fill
                sizes="(max-width: 768px) 70vw, 320px"
                quality={80}
                style={{ objectFit: "cover" }}
              />
              <div className="cat-card-shade" />
              <div className="cat-card-copy">
                <strong>{cat.label[lang]}</strong>
                <span>{cat.cta[lang]}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {canLoop && (
        <p className="cat-scroll-hint">
          <span className="cat-scroll-hint-arrows" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12h12M13 8l4 4-4 4" />
            </svg>
          </span>
          {t.home.categoriesScrollHint}
        </p>
      )}
    </section>
  );
}
