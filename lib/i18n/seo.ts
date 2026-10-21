import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  type Locale,
} from "@/lib/i18n/config";

export const HTML_LANG: Record<Locale, string> = {
  uk: "uk",
  en: "en",
};

export const OG_LOCALE: Record<Locale, string> = {
  uk: "uk_UA",
  en: "en_US",
};

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://logicclothes.ua"
  );
}

export function parseLangParam(raw: string): Locale {
  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function generateLocaleStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export function pageAlternates(lang: Locale, path = "") {
  const base = getSiteUrl();
  const suffix = path ? `/${path.replace(/^\//, "")}` : "";
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = `${base}/${locale}${suffix}`;
  }
  languages["x-default"] = `${base}/${DEFAULT_LOCALE}${suffix}`;
  return {
    canonical: `${base}/${lang}${suffix}`,
    languages,
  };
}

export const seoCopy: Record<
  Locale,
  {
    siteTitle: string;
    homeDescription: string;
    homeKeywords: string[];
    catalogTitle: string;
    catalogDescription: string;
  }
> = {
  uk: {
    siteTitle: "Logic Clothes — український бренд жіночого одягу",
    homeDescription:
      "Logic Clothes — жіночий одяг з 2015. Concept store у Києві на Софіївській, 5. Обмежені тиражі, натуральні тканини.",
    homeKeywords: [
      "Logic Clothes",
      "український бренд",
      "жіночий одяг",
      "Київ",
      "concept store",
    ],
    catalogTitle: "Каталог",
    catalogDescription:
      "Онлайн-каталог Logic Clothes — сукні, спідниці, верхній одяг та аксесуари.",
  },
  en: {
    siteTitle: "Logic Clothes — Ukrainian womenswear brand",
    homeDescription:
      "Logic Clothes — womenswear since 2015. Concept store in Kyiv at Sofiivska 5. Limited runs, natural fabrics.",
    homeKeywords: [
      "Logic Clothes",
      "Ukrainian brand",
      "womenswear",
      "Kyiv",
      "concept store",
    ],
    catalogTitle: "Catalog",
    catalogDescription:
      "Logic Clothes online catalog — dresses, skirts, outerwear and accessories.",
  },
};
