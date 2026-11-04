import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarBasket from "@/components/layout/SidebarBasket";
import SidebarMenu from "@/components/layout/SidebarMenu";
import SidebarSearch from "@/components/layout/SidebarSearch";
import JsonLd from "@/components/shared/JsonLd";
import RegisterSW from "@/components/shared/RegisterSW";
import { siteFont } from "@/lib/fonts/manrope";
import { AppProvider } from "@/lib/GeneralProvider";
import { BasketProvider } from "@/lib/BasketProvider";
import { WishlistProvider } from "@/lib/WishlistProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { HTML_LANG, getSiteUrl } from "@/lib/i18n/seo";
import type { Locale } from "@/lib/i18n/config";
import {
  generateOrganizationStructuredData,
  generateStoreStructuredData,
  generateWebsiteStructuredData,
} from "@/lib/seo";

export default function SiteHtmlShell({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  const baseUrl = getSiteUrl();

  return (
    <html lang={HTML_LANG[lang]} className={siteFont.variable}>
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/assets/logo-header.png" type="image/png" />
        <link rel="apple-touch-icon" href="/assets/logo-header.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111111" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="author" href="/humans.txt" />
        <link
          rel="preload"
          href="/fonts/manrope/manrope-cyrillic-200-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/manrope/manrope-latin-200-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/manrope/manrope-cyrillic-300-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/manrope/manrope-latin-300-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preload" href="/assets/logo-header.png" as="image" />
        <link rel="preload" href="/assets/hero.png" as="image" />
        <link rel="dns-prefetch" href={baseUrl} />
      </head>
      <body className={siteFont.className}>
        <JsonLd data={generateOrganizationStructuredData(baseUrl)} />
        <JsonLd data={generateStoreStructuredData(baseUrl)} />
        <JsonLd data={generateWebsiteStructuredData(baseUrl)} />
        <I18nProvider lang={lang}>
          <AppProvider>
            <BasketProvider>
              <WishlistProvider>
                <Header lang={lang} />
                <SidebarMenu lang={lang} />
                <SidebarBasket />
                <SidebarSearch lang={lang} />
                <main>{children}</main>
                <Footer lang={lang} />
              </WishlistProvider>
            </BasketProvider>
          </AppProvider>
        </I18nProvider>
        <RegisterSW />
      </body>
    </html>
  );
}
