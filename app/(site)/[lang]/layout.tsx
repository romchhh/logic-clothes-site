import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import SiteHtmlShell from "@/components/SiteHtmlShell";
import { isSupportedLocale } from "@/lib/i18n/config";
import {
  generateLocaleStaticParams,
  getSiteUrl,
  pageAlternates,
  parseLangParam,
  seoCopy,
  OG_LOCALE,
} from "@/lib/i18n/seo";
import "../globals.css";

export const generateStaticParams = generateLocaleStaticParams;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const copy = seoCopy[lang];
  const baseUrl = getSiteUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: copy.siteTitle,
      template: "%s | Logic Clothes",
    },
    description: copy.homeDescription,
    keywords: copy.homeKeywords,
    authors: [{ name: "Logic Clothes" }],
    creator: "Logic Clothes",
    publisher: "Logic Clothes",
    icons: {
      icon: [{ url: "/assets/logo-header.png", type: "image/png" }],
      apple: [{ url: "/assets/logo-header.png" }],
    },
    manifest: "/manifest.webmanifest",
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    },
    category: "fashion",
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      alternateLocale: Object.values(OG_LOCALE).filter(
        (v) => v !== OG_LOCALE[lang]
      ),
      url: `${baseUrl}/${lang}`,
      siteName: "Logic Clothes",
      title: copy.siteTitle,
      description: copy.homeDescription,
      images: [
        {
          url: `${baseUrl}/assets/hero.png`,
          width: 1200,
          height: 630,
          alt: "Logic Clothes",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.siteTitle,
      description: copy.homeDescription,
      images: [`${baseUrl}/assets/hero.png`],
    },
    alternates: pageAlternates(lang),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isSupportedLocale(lang)) notFound();

  return <SiteHtmlShell lang={lang}>{children}</SiteHtmlShell>;
}
