import type { AboutContent } from "@/lib/content/about";
import { aboutContent as defaultAbout } from "@/lib/content/about";
import type { LegalPage } from "@/lib/content/legal";
import { legalPages as defaultLegal } from "@/lib/content/legal";
import { query } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

export const SITE_PAGES_SETTING_KEY = "site_pages_json";

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

function withAboutExtras(
  base: AboutContent,
  lang: Locale
): AboutLocaleContent {
  return {
    ...base,
    customTitle:
      lang === "uk"
        ? "Ваш колір + ваш розмір за 14 днів"
        : "Your colour + your size in 14 days",
    customBody:
      lang === "uk"
        ? "Будь-який відтінок з нашої палітри — стандартна сітка або по ваших мірках. На сторінці товару оберіть колір і натисніть «Обговорити замовлення з живою людиною» — менеджер відповість у Instagram або Viber."
        : "Any shade from our palette — standard sizes or made to measure. On the product page pick a colour and tap «Discuss your order with a real person» — our manager will reply on Instagram or Viber.",
  };
}

export function defaultSitePages(): SitePagesStore {
  return {
    about: {
      uk: withAboutExtras(defaultAbout.uk, "uk"),
      en: withAboutExtras(defaultAbout.en, "en"),
    },
    legal: {
      uk: structuredClone(defaultLegal.uk),
      en: structuredClone(defaultLegal.en),
    },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function parseAboutLocale(
  raw: unknown,
  fallback: AboutLocaleContent
): AboutLocaleContent {
  if (!isObj(raw)) return fallback;
  return {
    title: String(raw.title ?? fallback.title),
    lead: String(raw.lead ?? fallback.lead),
    customTitle: String(raw.customTitle ?? fallback.customTitle),
    customBody: String(raw.customBody ?? fallback.customBody),
    sectionTitle: String(raw.sectionTitle ?? fallback.sectionTitle),
    points: Array.isArray(raw.points)
      ? raw.points.map(String).filter(Boolean)
      : fallback.points,
    closingTitle: String(raw.closingTitle ?? fallback.closingTitle),
    closing: Array.isArray(raw.closing)
      ? raw.closing.map(String).filter(Boolean)
      : fallback.closing,
  };
}

function parseLegalPage(raw: unknown, fallback: LegalPage): LegalPage {
  if (!isObj(raw)) return fallback;
  const sectionsRaw = Array.isArray(raw.sections) ? raw.sections : null;
  return {
    slug: String(raw.slug ?? fallback.slug),
    title: String(raw.title ?? fallback.title),
    updated: String(raw.updated ?? fallback.updated),
    intro: String(raw.intro ?? fallback.intro),
    sections: sectionsRaw
      ? sectionsRaw
          .filter(isObj)
          .map((s, i) => {
            const fb = fallback.sections[i];
            return {
              heading: String(s.heading ?? fb?.heading ?? ""),
              paragraphs: Array.isArray(s.paragraphs)
                ? s.paragraphs.map(String)
                : fb?.paragraphs,
              bullets: Array.isArray(s.bullets)
                ? s.bullets.map(String)
                : fb?.bullets,
            };
          })
          .filter((s) => s.heading)
      : fallback.sections,
  };
}

function mergeStore(raw: unknown): SitePagesStore {
  const defaults = defaultSitePages();
  if (!isObj(raw)) return defaults;

  const aboutRaw = isObj(raw.about) ? raw.about : {};
  const legalRaw = isObj(raw.legal) ? raw.legal : {};

  const legalUkDefaults = defaults.legal.uk;
  const legalEnDefaults = defaults.legal.en;
  const legalUkRaw = Array.isArray(legalRaw.uk) ? legalRaw.uk : [];
  const legalEnRaw = Array.isArray(legalRaw.en) ? legalRaw.en : [];

  const mergeLegal = (
    defs: LegalPage[],
    overrides: unknown[]
  ): LegalPage[] => {
    return defs.map((def) => {
      const found = overrides.find(
        (p) => isObj(p) && String(p.slug) === def.slug
      );
      return parseLegalPage(found, def);
    });
  };

  return {
    about: {
      uk: parseAboutLocale(aboutRaw.uk, defaults.about.uk),
      en: parseAboutLocale(aboutRaw.en, defaults.about.en),
    },
    legal: {
      uk: mergeLegal(legalUkDefaults, legalUkRaw),
      en: mergeLegal(legalEnDefaults, legalEnRaw),
    },
  };
}

export async function getSitePagesStore(): Promise<SitePagesStore> {
  try {
    const rows = await query<{ value: string }>(
      `SELECT value FROM site_settings WHERE key = $1`,
      [SITE_PAGES_SETTING_KEY]
    );
    const raw = rows[0]?.value;
    if (!raw?.trim()) return defaultSitePages();
    return mergeStore(JSON.parse(raw));
  } catch {
    return defaultSitePages();
  }
}

export async function saveSitePagesStore(
  store: SitePagesStore
): Promise<SitePagesStore> {
  const cleaned = mergeStore(store);
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [SITE_PAGES_SETTING_KEY, JSON.stringify(cleaned)]
  );
  return cleaned;
}

export async function getAboutPage(lang: Locale): Promise<AboutLocaleContent> {
  const store = await getSitePagesStore();
  return store.about[lang] || store.about.uk;
}

export async function getLegalPageContent(
  lang: Locale,
  slug: string
): Promise<LegalPage | undefined> {
  const store = await getSitePagesStore();
  return (
    store.legal[lang]?.find((p) => p.slug === slug) ||
    store.legal.uk.find((p) => p.slug === slug)
  );
}

export function getLegalSlugsFromStore(store: SitePagesStore): string[] {
  return store.legal.uk.map((p) => p.slug);
}
