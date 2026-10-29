"use client";

import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import LangSwitcher from "@/components/layout/LangSwitcher";
import { SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/siteContact";

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
              key={item.href}
              href={item.href}
              onClick={closePanels}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LangSwitcher lang={lang} variant="menu" onNavigate={closePanels} />
        <div className="mobile-menu-foot">
          <a href={`tel:${SITE_PHONE}`}>{SITE_PHONE_DISPLAY}</a>
          <Link href={`/${lang}/contacts`} onClick={closePanels}>
            Concept store · Київ
          </Link>
        </div>
      </div>
    </div>
  );
}
