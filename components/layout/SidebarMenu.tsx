"use client";

import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import LangSwitcher from "@/components/layout/LangSwitcher";
import {
  SITE_INSTAGRAM,
  SITE_INSTAGRAM_HANDLE,
  SITE_MAP_LINK,
} from "@/lib/siteContact";

export default function SidebarMenu({ lang }: { lang: Locale }) {
  const { t } = useI18n();
  const { isMenuOpen, closePanels } = useAppContext();

  const links = [
    { href: `/${lang}/catalog`, label: t.nav.catalog },
    { href: `/${lang}/about`, label: t.nav.whoWeAre },
    {
      href: `/${lang}/about#custom-order`,
      label: t.nav.custom14,
    },
    {
      href: `/${lang}/shipping-payment`,
      label: t.nav.shippingWorld,
    },
    { href: `/${lang}/contacts`, label: t.nav.contacts },
    { href: `/${lang}/contacts`, label: t.nav.storeKyiv },
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
        <nav aria-label={t.nav.menu}>
          {links.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={closePanels}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LangSwitcher lang={lang} variant="menu" onNavigate={closePanels} />
        <div className="mobile-menu-foot mobile-menu-foot--social">
          <a
            href={SITE_INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-menu-social"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span>{SITE_INSTAGRAM_HANDLE}</span>
          </a>
          <a
            href={SITE_MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-menu-social"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s7-7.2 7-12a7 7 0 10-14 0c0 4.8 7 12 7 12z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span>Київ, Софіївська 5</span>
          </a>
        </div>
      </div>
    </div>
  );
}
