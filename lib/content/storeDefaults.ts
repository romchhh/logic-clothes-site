import type { StoreLocaleContent } from "@/lib/sitePagesTypes";
import type { Locale } from "@/lib/i18n/config";

const DEFAULT_HERO = "/assets/footer-bg.png";

const UK_MARKDOWN = `Concept store **Logic Clothes** на Софіївській, 5 у Києві — місце, де можна приміряти обмежені тиражі, обрати відтінок з палітри та замовити пошиття у своєму розмірі.

## Виїзд і примірка

Попередньо напишіть у Instagram або телефоном — підкажемо час і наявність розмірів.

## Адреса

м. Київ, вул. Софіївська, 5
`;

const EN_MARKDOWN = `Logic Clothes **concept store** at Sofiivska 5 in Kyiv — try limited-run pieces, pick a palette shade, and order your size.

## Visit & try-on

Message us on Instagram or call ahead — we’ll suggest a time and sizes in stock.

## Address

Kyiv, 5 Sofiivska St.
`;

export function defaultStorePage(lang: Locale): StoreLocaleContent {
  if (lang === "en") {
    return {
      title: "Our store in Kyiv",
      lead: "Concept store at Sofiivska 5 — try-ons and pickup.",
      heroImage: DEFAULT_HERO,
      bodyMarkdown: EN_MARKDOWN,
      gallery: [],
    };
  }
  return {
    title: "Наш магазин у Києві",
    lead: "Concept store на Софіївській, 5 — примірка та видача замовлень.",
    heroImage: DEFAULT_HERO,
    bodyMarkdown: UK_MARKDOWN,
    gallery: [],
  };
}