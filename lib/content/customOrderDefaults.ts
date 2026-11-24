import type { CustomOrderLocaleContent } from "@/lib/sitePagesTypes";
import type { Locale } from "@/lib/i18n/config";

const DEFAULT_HERO = "/assets/footer-bg.png";

const UK_MARKDOWN = `Обираєте модель з каталогу — і ми зшиваємо її у **вашому кольорі** з палітри та у **вашому розмірі**.

## Як це працює

1. Обираєте річ на сайті.
2. Вказуєте колір з палітри та розмір (стандартна сітка або мірки).
3. Обговорюєте деталі в Instagram або Viber.
4. Ми зшиваємо замовлення орієнтовно **за 14 днів**.

## Колір

Будь-який відтінок з наших палітр. На сторінці товару відкрийте палітру й оберіть потрібний колір — або напишіть нам, якщо потрібна консультація.

## Розмір

Стандартна сітка або пошиття за вашими мірками. Якщо між розмірами — підкажемо посадку.

## Що далі

Після підтвердження деталей менеджер супроводжує замовлення до видачі в магазині або відправки.
`;

const EN_MARKDOWN = `Pick a piece from the catalog — we sew it in **your colour** from our palette and in **your size**.

## How it works

1. Choose an item on the site.
2. Pick a palette colour and a size (standard grid or your measurements).
3. Confirm details on Instagram or Viber.
4. We sew the order in about **14 days**.

## Colour

Any shade from our palettes. On the product page open a palette and choose a colour — or message us if you want advice.

## Size

Standard sizes or made to measure. If you’re between sizes, we’ll help with fit.

## Next steps

After details are confirmed, a manager follows your order through to store pickup or shipping.
`;

export function defaultCustomOrder(lang: Locale): CustomOrderLocaleContent {
  if (lang === "en") {
    return {
      title: "Your colour + your size in 14 days",
      lead: "Custom colour and size — sewn to order in about two weeks.",
      heroImage: DEFAULT_HERO,
      bodyMarkdown: EN_MARKDOWN,
      gallery: [],
    };
  }
  return {
    title: "Ваш колір + ваш розмір за 14 днів",
    lead: "Кастомний колір і розмір — пошиємо орієнтовно за два тижні.",
    heroImage: DEFAULT_HERO,
    bodyMarkdown: UK_MARKDOWN,
    gallery: [],
  };
}
