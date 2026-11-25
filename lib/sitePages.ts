import type { AboutContent } from "@/lib/content/about";
import { aboutContent as defaultAbout } from "@/lib/content/about";
import { defaultCustomOrder } from "@/lib/content/customOrderDefaults";
import { defaultStorePage } from "@/lib/content/storeDefaults";
import { saveStorePhotos } from "@/lib/storePhotos";
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
  CustomOrderLocaleContent,
  StoreLocaleContent,
  SitePagesStore,
} from "@/lib/sitePagesTypes";

export type {
  AboutLocaleContent,
  ContentPageSlug,
  CustomOrderLocaleContent,
  StoreLocaleContent,
  SitePagesStore,
} from "@/lib/sitePagesTypes";
export { CONTENT_PAGE_DEFS } from "@/lib/sitePagesTypes";

export const SITE_PAGES_SETTING_KEY = "site_pages_json";

const DEFAULT_ABOUT_HERO = "/assets/footer-bg.png";

function withAboutExtras(base: AboutContent): AboutLocaleContent {
  const draft: AboutLocaleContent = {
    ...base,
    customTitle: "",
    customBody: "",
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
      uk: withAboutExtras(defaultAbout.uk),
      en: withAboutExtras(defaultAbout.en),
    },
    customOrder: {
      uk: defaultCustomOrder("uk"),
      en: defaultCustomOrder("en"),
    },
    store: {
      uk: defaultStorePage("uk"),
      en: defaultStorePage("en"),
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

function parseStoreLocale(
  raw: unknown,
  fallback: StoreLocaleContent
): StoreLocaleContent {
  if (!isObj(raw)) return fallback;
  const body = String(raw.bodyMarkdown ?? "").trim()
    ? String(raw.bodyMarkdown)
    : fallback.bodyMarkdown;
  return {
    title: String(raw.title ?? fallback.title),
    lead: String(raw.lead ?? fallback.lead),
    heroImage:
      cleanUrl(raw.heroImage) || fallback.heroImage || DEFAULT_ABOUT_HERO,
    bodyMarkdown: body,
    gallery: parseGallery(raw.gallery ?? fallback.gallery),
  };
}

function parseCustomOrderLocale(
  raw: unknown,
  fallback: CustomOrderLocaleContent
): CustomOrderLocaleContent {
  if (!isObj(raw)) return fallback;
  const body = String(raw.bodyMarkdown ?? "").trim()
    ? String(raw.bodyMarkdown)
    : fallback.bodyMarkdown;
  return {
    title: String(raw.title ?? fallback.title),
    lead: String(raw.lead ?? fallback.lead),
    heroImage:
      cleanUrl(raw.heroImage) || fallback.heroImage || DEFAULT_ABOUT_HERO,
    bodyMarkdown: body,
    gallery: parseGallery(raw.gallery ?? fallback.gallery),
  };
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

  const customRaw = isObj(raw.customOrder) ? raw.customOrder : {};
  const storeRaw = isObj(raw.store) ? raw.store : {};

  return {
    about: {
      uk: parseAboutLocale(aboutRaw.uk, defaults.about.uk),
      en: parseAboutLocale(aboutRaw.en, defaults.about.en),
    },
    customOrder: {
      uk: parseCustomOrderLocale(customRaw.uk, defaults.customOrder.uk),
      en: parseCustomOrderLocale(customRaw.en, defaults.customOrder.en),
    },
    store: {
      uk: parseStoreLocale(storeRaw.uk, defaults.store.uk),
      en: parseStoreLocale(storeRaw.en, defaults.store.en),
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

async function syncStorePhotosFromPageContent(store: SitePagesStore) {
  const gallery =
    store.store.uk.gallery?.length
      ? store.store.uk.gallery
      : store.store.en.gallery || [];
  if (!gallery.length) return;
  await saveStorePhotos(
    gallery.map((img) => ({
      src: img.src,
      altUk: img.altUk,
      altEn: img.altEn,
    }))
  );
}

export async function saveSitePagesStore(
  store: SitePagesStore
): Promise<SitePagesStore> {
  const cleaned = mergeStore(store);
  await syncStorePhotosFromPageContent(cleaned);
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
    revalidatePath("/uk/custom-order");
    revalidatePath("/en/custom-order");
    revalidatePath("/uk/store");
    revalidatePath("/en/store");
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

export async function getCustomOrderPage(
  lang: Locale
): Promise<CustomOrderLocaleContent> {
  const store = await getSitePagesStore();
  return store.customOrder[lang] || store.customOrder.uk;
}

export async function getStorePage(lang: Locale): Promise<StoreLocaleContent> {
  const store = await getSitePagesStore();
  const page = store.store[lang] || store.store.uk;
  const { getStorePhotos } = await import("@/lib/storePhotos");
  if (!page.gallery?.length) {
    const legacy = await getStorePhotos();
    return {
      ...page,
      gallery: legacy.map((p) => ({
        src: p.src,
        altUk: p.altUk,
        altEn: p.altEn,
      })),
    };
  }
  return page;
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
