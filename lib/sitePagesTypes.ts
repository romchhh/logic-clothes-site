import type { AboutContent } from "@/lib/content/about";
import type { LegalPage } from "@/lib/content/legal";
import type { Locale } from "@/lib/i18n/config";

export const CONTENT_PAGE_DEFS = [
  { slug: "about", label: "Про нас", kind: "about" as const },
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

export type AboutLocaleContent = AboutContent & {
  customTitle: string;
  customBody: string;
};

export type SitePagesStore = {
  about: Record<Locale, AboutLocaleContent>;
  legal: Record<Locale, LegalPage[]>;
};
