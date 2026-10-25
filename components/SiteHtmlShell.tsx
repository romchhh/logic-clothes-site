import { Jost } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarBasket from "@/components/layout/SidebarBasket";
import SidebarMenu from "@/components/layout/SidebarMenu";
import SidebarSearch from "@/components/layout/SidebarSearch";
import JsonLd from "@/components/shared/JsonLd";
import RegisterSW from "@/components/shared/RegisterSW";
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

const jost = Jost({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["200", "300"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  variable: "--font-jost",
  adjustFontFallback: true,
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export default function SiteHtmlShell({
  lang,
  children,
}: {
  lang: Locale;
  children: React.ReactNode;
}) {
  const baseUrl = getSiteUrl();

  return (
    <html lang={HTML_LANG[lang]} className={jost.variable}>
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
        <link rel="preload" href="/assets/logo-header.png" as="image" />
        <link rel="preload" href="/assets/hero.png" as="image" />
        <link rel="dns-prefetch" href={baseUrl} />
      </head>
      <body className={jost.className}>
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
