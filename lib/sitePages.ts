import type { AboutContent } from "@/lib/content/about";
import { aboutContent as defaultAbout } from "@/lib/content/about";
import type { LegalPage } from "@/lib/content/legal";
import { legalPages as defaultLegal } from "@/lib/content/legal";
import {
  aboutToMarkdown,
  legalToMarkdown,
} from "@/lib/content/markdownDefaults";
import { query } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";
import { revalidatePath } from "next/cache";
import type {
  AboutLocaleContent,
  ContentGalleryImage,
  SitePagesStore,
} from "@/lib/sitePagesTypes";

export type {
  AboutLocaleContent,
  ContentPageSlug,
  SitePagesStore,
} from "@/lib/sitePagesTypes";
export { CONTENT_PAGE_DEFS } from "@/lib/sitePagesTypes";

export const SITE_PAGES_SETTING_KEY = "site_pages_json";

const DEFAULT_ABOUT_HERO = "/assets/footer-bg.png";

function withAboutExtras(
  base: AboutContent,
  lang: Locale
): AboutLocaleContent {
  const customTitle =
    lang === "uk"
      ? "Ваш колір + ваш розмір за 14 днів"
      : "Your colour + your size in 14 days";
  const customBody =
    lang === "uk"
      ? "Будь-який відтінок з нашої палітри — стандартна сітка або по ваших мірках. На сторінці товару оберіть колір і натисніть «Обговорити замовлення з живою людиною» — менеджер відповість у Instagram або Viber."
      : "Any shade from our palette — standard sizes or made to measure. On the product page pick a colour and tap «Discuss your order with a real person» — our manager will reply on Instagram or Viber.";

  const draft: AboutLocaleContent = {
    ...base,
    customTitle,
    customBody,
    heroImage: DEFAULT_ABOUT_HERO,
    bodyMarkdown: "",
    gallery: [],
  };
  draft.bodyMarkdown = aboutToMarkdown(draft);
  return draft;
}

export function defaultSitePages(): SitePagesStore {
  const legalUk = structuredClone(defaultLegal.uk).map((p) => ({
    ...p,
    heroImage: "",
    bodyMarkdown: legalToMarkdown(p),
    gallery: [] as ContentGalleryImage[],
  }));
  const legalEn = structuredClone(defaultLegal.en).map((p) => ({
    ...p,
    heroImage: "",
    bodyMarkdown: legalToMarkdown(p),
    gallery: [] as ContentGalleryImage[],
  }));

  return {
    about: {
      uk: withAboutExtras(defaultAbout.uk, "uk"),
      en: withAboutExtras(defaultAbout.en, "en"),
    },
    legal: {
      uk: legalUk,
      en: legalEn,
    },
  };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function cleanUrl(url: unknown): string {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return new URL(trimmed).pathname || trimmed;
    }
  } catch {
    /* keep */
  }
  return trimmed.split("?")[0].split("#")[0];
}

function parseGallery(raw: unknown): ContentGalleryImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .map((row) => ({
      src: cleanUrl(row.src || row.url || row.image),
      altUk: String(row.altUk ?? row.alt ?? "").trim(),
      altEn: String(row.altEn ?? row.alt ?? "").trim(),
    }))
    .filter((row) => row.src);
}

function parseAboutLocale(
  raw: unknown,
  fallback: AboutLocaleContent
): AboutLocaleContent {
  if (!isObj(raw)) return fallback;
  const merged: AboutLocaleContent = {
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
    heroImage:
      cleanUrl(raw.heroImage) || fallback.heroImage || DEFAULT_ABOUT_HERO,
    bodyMarkdown: String(raw.bodyMarkdown ?? "").trim()
      ? String(raw.bodyMarkdown)
      : "",
    gallery: parseGallery(raw.gallery),
  };
  if (!merged.bodyMarkdown.trim()) {
    merged.bodyMarkdown = aboutToMarkdown(merged);
  }
  return merged;
}

function parseLegalPage(raw: unknown, fallback: LegalPage): LegalPage {
  if (!isObj(raw)) return fallback;
  const sectionsRaw = Array.isArray(raw.sections) ? raw.sections : null;
  const page: LegalPage = {
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
    heroImage: cleanUrl(raw.heroImage) || fallback.heroImage || "",
    bodyMarkdown: String(raw.bodyMarkdown ?? "").trim()
      ? String(raw.bodyMarkdown)
      : fallback.bodyMarkdown || "",
    gallery: parseGallery(raw.gallery ?? fallback.gallery),
  };
  if (!page.bodyMarkdown?.trim()) {
    page.bodyMarkdown = legalToMarkdown(page);
  }
  return page;
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
  try {
    revalidatePath("/uk");
    revalidatePath("/en");
    revalidatePath("/uk/about");
    revalidatePath("/en/about");
    revalidatePath("/uk/shipping-payment");
    revalidatePath("/en/shipping-payment");
    revalidatePath("/uk/contacts");
    revalidatePath("/en/contacts");
    revalidatePath("/uk/returns");
    revalidatePath("/en/returns");
  } catch {
    /* ignore */
  }
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
