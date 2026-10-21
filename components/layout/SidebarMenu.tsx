"use client";

import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import { SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/siteContact";

export default function SidebarMenu({ lang }: { lang: Locale }) {
  const { t } = useI18n();
  const { isMenuOpen, closePanels } = useAppContext();

  const links = [
    { href: `/${lang}/catalog`, label: t.nav.catalog },
    { href: `/${lang}/catalog?category=new`, label: t.nav.new },
    { href: `/${lang}/catalog?category=dresses`, label: lang === "uk" ? "Сукні" : "Dresses" },
    { href: `/${lang}/catalog?category=outerwear`, label: lang === "uk" ? "Верхній одяг" : "Outerwear" },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/contacts`, label: t.nav.stores },
    { href: `/${lang}/shipping-payment`, label: lang === "uk" ? "Оплата і доставка" : "Shipping & Payment" },
  ];

  return (
    <div
      className={`mobile-menu${isMenuOpen ? " open" : ""}`}
      aria-hidden={!isMenuOpen}
      onClick={(e) => {
        if (e.target === e.currentTarget) closePanels();
      }}
    >
      <div className="mobile-menu-panel">
        <div className="mobile-menu-head">
          <h2>{t.nav.menu}</h2>
          <button type="button" onClick={closePanels} aria-label={t.a11y.close}>
            ×
          </button>
        </div>
        <nav>
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={closePanels}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <a href={`tel:${SITE_PHONE}`}>{SITE_PHONE_DISPLAY}</a>
          <Link href={`/${lang}#about`} onClick={closePanels}>
            Concept store · Київ
          </Link>
        </div>
      </div>
    </div>
  );
}
