"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import { switchLocalePath } from "@/lib/i18n/path";
import { getMessages } from "@/lib/i18n/messages";

type Variant = "icon" | "region" | "menu";

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

  const ukPath = switchLocalePath(pathname, lang, "uk");
  const enPath = switchLocalePath(pathname, lang, "en");
  const regionLabel = getMessages(lang).footer.region;
  const options = [
    { locale: "uk" as const, href: ukPath, label: getMessages("uk").footer.region },
    { locale: "en" as const, href: enPath, label: getMessages("en").footer.region },
  ];

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
              className={`mobile-menu-lang-opt${
                lang === opt.locale ? " is-active" : ""
              }`}
              onClick={() => onNavigate?.()}
            >
              {opt.label}
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
          <svg
            className="lang-menu-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18" />
            <path d="M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9S9.5 5.8 12 3z" />
          </svg>
        ) : (
          <>
            <span>{regionLabel}</span>
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
            className={`lang-menu-opt${lang === opt.locale ? " is-active" : ""}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {variant === "region" ? opt.label : opt.locale.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}
