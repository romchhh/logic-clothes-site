"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { switchLocalePath } from "@/lib/i18n/path";

type Variant = "icon" | "region" | "menu";

const LANG_OPTIONS: {
  locale: Locale;
  label: string;
}[] = [
  { locale: "uk", label: "українська" },
  { locale: "en", label: "english" },
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

  const options = LANG_OPTIONS.map((opt) => ({
    ...opt,
    href: switchLocalePath(pathname, lang, opt.locale),
  }));

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
              <span>{opt.label}</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`lang-menu lang-menu--${variant} lang-menu--always`}
      aria-label={ariaLabel}
    >
      <div className="lang-menu-opts-inline" role="group">
        {options.map((opt) => (
          <Link
            key={opt.locale}
            href={opt.href}
            className={`lang-pill lang-pill--${opt.locale}${
              variant === "icon" ? " lang-pill--compact" : ""
            }${lang === opt.locale ? " is-active" : ""}`}
            aria-current={lang === opt.locale ? "true" : undefined}
            onClick={() => onNavigate?.()}
          >
            {variant === "icon" ? (
              <span className="lang-pill-code">
                {opt.locale === "uk" ? "UA" : "EN"}
              </span>
            ) : (
              <span>{opt.label}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
