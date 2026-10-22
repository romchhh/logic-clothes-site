import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/categories";
import { getLegalSlugs } from "@/lib/content/legal";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/i18n/seo";
import { isCatalogProduct } from "@/lib/catalogProduct";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/types";

function languageAlternates(path: string) {
  const base = getSiteUrl();
  const languages: Record<string, string> = {};
  for (const lang of SUPPORTED_LOCALES) {
    languages[lang] = path ? `${base}/${lang}/${path}` : `${base}/${lang}`;
  }
  languages["x-default"] = path ? `${base}/uk/${path}` : `${base}/uk`;
  return languages;
}

function absImage(src: string, base: string) {
  if (!src) return undefined;
  if (src.startsWith("http")) return src;
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}

function entry(
  lang: Locale,
  path: string,
  opts: {
    lastModified?: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
    images?: string[];
  }
): MetadataRoute.Sitemap[number] {
  const base = getSiteUrl();
  const url = path ? `${base}/${lang}/${path}` : `${base}/${lang}`;
  return {
    url,
    lastModified: opts.lastModified || new Date(),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: {
      languages: languageAlternates(path),
    },
    ...(opts.images?.length ? { images: opts.images } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  let products: Product[] = [];
  let categoryIds: string[] = [];

  try {
    products = (await getProducts()).filter(isCatalogProduct);
  } catch (err) {
    console.warn(
      "[sitemap] skipping product URLs:",
      err instanceof Error ? err.message : err
    );
  }

  try {
    const categories = await getCategories();
    categoryIds = categories
      .filter((c) => c.isVisible && c.id !== "all")
      .map((c) => c.id);
  } catch (err) {
    console.warn(
      "[sitemap] skipping category URLs:",
      err instanceof Error ? err.message : err
    );
  }

  const legalSlugs = getLegalSlugs();

  const staticPaths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "about", changeFrequency: "monthly", priority: 0.7 },
    ...legalSlugs.map((slug) => ({
      path: slug,
      changeFrequency: "monthly" as const,
      priority: slug === "contacts" ? 0.65 : 0.35,
    })),
  ];

  const staticEntries = SUPPORTED_LOCALES.flatMap((lang) =>
    staticPaths.map((p) =>
      entry(lang, p.path, {
        lastModified: now,
        changeFrequency: p.changeFrequency,
        priority: p.priority,
      })
    )
  );

  const categoryEntries = SUPPORTED_LOCALES.flatMap((lang) =>
    categoryIds.map((id) => {
      const path = `catalog?category=${encodeURIComponent(id)}`;
      const url = `${base}/${lang}/${path}`;
      return {
        url,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
        alternates: {
          languages: Object.fromEntries([
            ...SUPPORTED_LOCALES.map((l) => [
              l,
              `${base}/${l}/catalog?category=${encodeURIComponent(id)}`,
            ]),
            [
              "x-default",
              `${base}/uk/catalog?category=${encodeURIComponent(id)}`,
            ],
          ]),
        },
      };
    })
  );

  const productEntries = SUPPORTED_LOCALES.flatMap((lang) =>
    products.map((p) => {
      const img = absImage(p.images?.[0] || "", base);
      return entry(lang, `product/${p.id}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: p.isNew || p.isPopular ? 0.85 : 0.75,
        images: img ? [img] : undefined,
      });
    })
  );

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
