"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import { SITE_INSTAGRAM, SITE_NAME } from "@/lib/siteContact";
import LangSwitcher from "@/components/layout/LangSwitcher";

export default function Footer({ lang }: { lang: Locale }) {
  const { t } = useI18n();

  const navLinks = [
    { href: `/${lang}/about`, label: t.footer.about },
    { href: `/${lang}/contacts`, label: t.footer.contactsPage },
    { href: `/${lang}/shipping-payment`, label: t.footer.shipping },
    { href: `/${lang}/shipping-payment`, label: t.footer.payment },
    { href: `/${lang}/returns`, label: t.footer.returns },
    { href: `/${lang}/contacts`, label: t.nav.stores },
    {
      href: SITE_INSTAGRAM,
      label: t.footer.instagram,
      external: true,
    },
  ];

  const legalLinks = [
    { href: `/${lang}/privacy-policy`, label: t.footer.privacy },
    { href: `/${lang}/terms-of-service`, label: t.footer.offer },
  ];

  return (
    <footer className="site-foot">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brush-art site-foot-brush"
        src="/assets/brush-pink.png"
        alt=""
        aria-hidden="true"
      />

      <div className="site-foot-inner">
        <p className="site-foot-slogan">
          {t.footer.slogan}{" "}
          <strong>{t.footer.sloganAccent}</strong>
        </p>

        <nav className="site-foot-nav" aria-label="Footer">
          {navLinks.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.label}
              </a>
            ) : (
              <Link key={item.label + item.href} href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="site-foot-region">
          <LangSwitcher lang={lang} variant="region" />
        </div>

        <div className="site-foot-bottom">
          <span>
            © {SITE_NAME} {new Date().getFullYear()}
          </span>
          <span className="site-foot-bottom-links">
            {legalLinks.map((item, i) => (
              <span key={item.href}>
                {i > 0 && " · "}
                <Link href={item.href}>{item.label}</Link>
              </span>
            ))}
          </span>
        </div>

        <p className="site-foot-credit">
          {t.footer.developedBy}{" "}
          <a
            href={
              lang === "uk"
                ? "https://telebots.site/uk"
                : "https://telebots.site/"
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.footer.developedByBrand}
          </a>
        </p>
      </div>
    </footer>
  );
}
