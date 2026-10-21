"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useWishlist } from "@/lib/WishlistProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import { SITE_NAME } from "@/lib/siteContact";
import LangSwitcher from "@/components/layout/LangSwitcher";

export default function Header({ lang }: { lang: Locale }) {
  const { t } = useI18n();
  const {
    setIsMenuOpen,
    setIsBasketOpen,
    setIsWishOpen,
    setIsSearchOpen,
  } = useAppContext();
  const { count: cartCount } = useBasket();
  const { count: wishCount } = useWishlist();

  const nav = [
    { href: `/${lang}/catalog`, label: t.nav.catalog },
    { href: `/${lang}/catalog?category=new`, label: t.nav.new },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/contacts`, label: t.nav.stores },
  ];

  function openSearch() {
    setIsSearchOpen(true);
    setIsBasketOpen(false);
    setIsWishOpen(false);
    setIsMenuOpen(false);
  }

  return (
    <div className="site-bar" id="site-bar">
      <header className="site-header">
        <Link href={`/${lang}`} className="site-logo" aria-label={SITE_NAME}>
          <Image
            src="/assets/logo-header.png"
            alt={SITE_NAME}
            width={160}
            height={48}
            priority
            sizes="160px"
            style={{ width: "auto", height: "100%", objectFit: "contain" }}
          />
        </Link>

        <div className="site-left">
          <nav className="site-nav" aria-label="Main">
            {nav.map((item) => (
              <Link key={item.label + item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="site-icons">
          <button
            type="button"
            className="icon-btn site-search"
            aria-label={t.a11y.search}
            onClick={openSearch}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hdr-icon hdr-icon--dark"
              src="/assets/icons/search.svg"
              width={26}
              height={26}
              alt=""
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="hdr-icon hdr-icon--light"
              src="/assets/icons/search-light.svg"
              width={26}
              height={26}
              alt=""
            />
          </button>

          <LangSwitcher lang={lang} variant="icon" />

          <Link
            href={`/${lang}/wishlist`}
            className="icon-btn icon-btn--wish"
            aria-label={t.a11y.wishlist}
            onClick={() => {
              setIsBasketOpen(false);
              setIsWishOpen(false);
              setIsSearchOpen(false);
              setIsMenuOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z" />
            </svg>
            {wishCount > 0 && <span className="icon-badge">{wishCount}</span>}
          </Link>
          <button
            type="button"
            className="icon-btn icon-btn--cart"
            aria-label={t.a11y.cart}
            onClick={() => {
              setIsBasketOpen(true);
              setIsWishOpen(false);
              setIsSearchOpen(false);
              setIsMenuOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                className="cart-icon-handle"
                d="M7.5 9V7.2C7.5 4.85 9.35 3 11.7 3h.6C14.65 3 16.5 4.85 16.5 7.2V9"
              />
              <path
                className="cart-icon-body"
                d="M5.2 9.2h13.6c.88 0 1.55.78 1.43 1.65l-1.1 8.1A2.2 2.2 0 0 1 17 20.8H7a2.2 2.2 0 0 1-2.13-1.85l-1.1-8.1A1.45 1.45 0 0 1 5.2 9.2Z"
              />
            </svg>
            {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
          </button>
          <button
            type="button"
            className="site-burger icon-btn"
            aria-label={t.a11y.menu}
            onClick={() => {
              setIsMenuOpen(true);
              setIsBasketOpen(false);
              setIsWishOpen(false);
              setIsSearchOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>
    </div>
  );
}
