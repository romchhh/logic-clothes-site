import type { MetadataRoute } from "next";
import { getLegalSlugs } from "@/lib/content/legal";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/i18n/seo";
import { getAllProductIds } from "@/lib/products";

function languageAlternates(path: string) {
  const base = getSiteUrl();
  const languages: Record<string, string> = {};
  for (const lang of SUPPORTED_LOCALES) {
    languages[lang] = path ? `${base}/${lang}/${path}` : `${base}/${lang}`;
  }
  languages["x-default"] = path ? `${base}/uk/${path}` : `${base}/uk`;
  return languages;
}

function entry(
  lang: Locale,
  path: string,
  opts: {
    lastModified?: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
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
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productIds = await getAllProductIds();
  const legalSlugs = getLegalSlugs();
  const now = new Date();

  const staticPaths: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "catalog", changeFrequency: "daily", priority: 0.9 },
    { path: "about", changeFrequency: "monthly", priority: 0.6 },
    ...legalSlugs.map((slug) => ({
      path: slug,
      changeFrequency: "monthly" as const,
      priority: slug === "contacts" ? 0.6 : 0.3,
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

  const productEntries = SUPPORTED_LOCALES.flatMap((lang) =>
    productIds.map((id) =>
      entry(lang, `product/${id}`, {
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    )
  );

  return [...staticEntries, ...productEntries];
}
