"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { switchLocalePath } from "@/lib/i18n/path";

type Variant = "icon" | "region" | "menu";

const LANG_OPTIONS: {
  locale: Locale;
  label: string;
  flag: string;
}[] = [
  { locale: "uk", label: "українська", flag: "🇺🇦" },
  { locale: "en", label: "english", flag: "🇬🇧" },
];

export default function LangSwitcher({
  lang,
  variant = "icon",
  onNavigate,
}: {
  lang: Locale;
  variant?: Variant;
  /** Called after picking a locale (e.g. close mobile menu). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const options = LANG_OPTIONS.map((opt) => ({
    ...opt,
    href: switchLocalePath(pathname, lang, opt.locale),
  }));
  const current = options.find((o) => o.locale === lang) ?? options[0];

  useEffect(() => {
    setOpen(false);
  }, [pathname, lang]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const ariaLabel =
    lang === "uk" ? "Перемкнути мову" : "Switch language";

  if (variant === "menu") {
    return (
      <div className="mobile-menu-lang" aria-label={ariaLabel}>
        <span className="mobile-menu-lang-label">
          {lang === "uk" ? "Мова" : "Language"}
        </span>
        <div className="mobile-menu-lang-opts">
          {options.map((opt) => (
            <Link
              key={opt.locale}
              href={opt.href}
              className={`mobile-menu-lang-opt lang-pill lang-pill--${opt.locale}${
                lang === opt.locale ? " is-active" : ""
              }`}
              onClick={() => onNavigate?.()}
            >
              <span className="lang-pill-flag" aria-hidden>
                {opt.flag}
              </span>
              <span>{opt.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`lang-menu lang-menu--${variant}${open ? " is-open" : ""}`}
      ref={ref}
    >
      <button
        type="button"
        className={
          variant === "icon"
            ? "icon-btn lang-menu-toggle"
            : "lang-menu-region"
        }
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        {variant === "icon" ? (
          <span className={`lang-pill lang-pill--compact lang-pill--${lang}`}>
            <span className="lang-pill-flag" aria-hidden>
              {current.flag}
            </span>
            <span className="lang-pill-code">
              {lang === "uk" ? "UA" : "EN"}
            </span>
          </span>
        ) : (
          <>
            <span className={`lang-pill lang-pill--${lang}`}>
              <span className="lang-pill-flag" aria-hidden>
                {current.flag}
              </span>
              <span>{current.label}</span>
            </span>
            <svg
              className="lang-menu-chevron"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </>
        )}
      </button>

      <div className="lang-menu-panel" role="menu">
        {options.map((opt) => (
          <Link
            key={opt.locale}
            href={opt.href}
            className={`lang-menu-opt lang-pill lang-pill--${opt.locale}${
              lang === opt.locale ? " is-active" : ""
            }`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="lang-pill-flag" aria-hidden>
              {opt.flag}
            </span>
            <span>{opt.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
