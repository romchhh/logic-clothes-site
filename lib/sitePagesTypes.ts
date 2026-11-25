import type { AboutContent } from "@/lib/content/about";
import type { LegalPage } from "@/lib/content/legal";
import type { Locale } from "@/lib/i18n/config";

export const CONTENT_PAGE_DEFS = [
  { slug: "about", label: "Про нас", kind: "about" as const },
  {
    slug: "custom-order",
    label: "Ваш колір + розмір (14 днів)",
    kind: "custom" as const,
  },
  { slug: "store-photos", label: "Магазин у Києві", kind: "store" as const },
  { slug: "contacts", label: "Контакти", kind: "legal" as const },
  {
    slug: "shipping-payment",
    label: "Оплата і доставка",
    kind: "legal" as const,
  },
  { slug: "returns", label: "Повернення та обмін", kind: "legal" as const },
  {
    slug: "privacy-policy",
    label: "Політика конфіденційності",
    kind: "legal" as const,
  },
  {
    slug: "terms-of-service",
    label: "Публічна оферта",
    kind: "legal" as const,
  },
  { slug: "cookie-policy", label: "Політика cookies", kind: "legal" as const },
] as const;

export type ContentPageSlug = (typeof CONTENT_PAGE_DEFS)[number]["slug"];

export type ContentGalleryImage = {
  src: string;
  altUk: string;
  altEn: string;
};

export type AboutLocaleContent = AboutContent & {
  /** @deprecated Kept for older JSON; customization lives on custom-order page. */
  customTitle: string;
  /** @deprecated Kept for older JSON; customization lives on custom-order page. */
  customBody: string;
  /** Cover / hero image on /about */
  heroImage: string;
  /**
   * Primary editable body (markdown).
   * When set, site renders this instead of structured lead/points/closing.
   */
  bodyMarkdown: string;
  /** Optional photo strip under the text */
  gallery: ContentGalleryImage[];
};

/** Standalone page: your colour + size in ~14 days. */
export type CustomOrderLocaleContent = {
  title: string;
  lead: string;
  heroImage: string;
  bodyMarkdown: string;
  gallery: ContentGalleryImage[];
};

/** /store — hero, text, photo strip (also synced to PDP store strip). */
export type StoreLocaleContent = {
  title: string;
  lead: string;
  heroImage: string;
  bodyMarkdown: string;
  gallery: ContentGalleryImage[];
};

export type SitePagesStore = {
  about: Record<Locale, AboutLocaleContent>;
  customOrder: Record<Locale, CustomOrderLocaleContent>;
  store: Record<Locale, StoreLocaleContent>;
  legal: Record<Locale, LegalPage[]>;
};
