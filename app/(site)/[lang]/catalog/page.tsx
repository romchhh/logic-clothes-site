import type { Metadata } from "next";
import CatalogServer from "@/components/catalog/CatalogServer";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { getCategories } from "@/lib/categories";
import { getMessages } from "@/lib/i18n/messages";
import {
  parseLangParam,
  pageAlternates,
  seoCopy,
  getSiteUrl,
} from "@/lib/i18n/seo";
import { getProductsByCategory } from "@/lib/products";
import {
  generateBreadcrumbStructuredData,
  generateCollectionPageStructuredData,
} from "@/lib/seo";
import { productName } from "@/lib/types";

/** Catalog must reflect admin visibility toggles quickly. */
export const revalidate = 60;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const { category } = await searchParams;
  const lang = parseLangParam(raw);
  const copy = seoCopy[lang];
  const categories = await getCategories();
  const active = categories.find((c) => c.id === category);

  const title = active
    ? `${active.label[lang]} — ${copy.catalogTitle}`
    : copy.catalogTitle;
  const description = active
    ? lang === "uk"
      ? `${active.label.uk} у каталозі Logic Clothes. Жіночий одяг обмежених тиражів.`
      : `${active.label.en} in the Logic Clothes catalog. Limited-run womenswear.`
    : copy.catalogDescription;

  const path = active
    ? `catalog?category=${encodeURIComponent(active.id)}`
    : "catalog";

  return {
    title,
    description,
    alternates: pageAlternates(lang, path),
    openGraph: {
      title: `${title} | Logic Clothes`,
      description,
      url: `${getSiteUrl()}/${lang}/${path}`,
      type: "website",
    },
  };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { lang: raw } = await params;
  const { category } = await searchParams;
  const lang = parseLangParam(raw);
  const t = getMessages(lang);
  const copy = seoCopy[lang];
  const baseUrl = getSiteUrl();

  const categories = await getCategories();
  const showCategoryHub = !category;
  const active =
    category && categories.some((c) => c.id === category) ? category : "all";
  const activeCat = categories.find((c) => c.id === active);
  const products = showCategoryHub ? [] : await getProductsByCategory(active);
  const title = activeCat?.label[lang] || copy.catalogTitle;
  const description = copy.catalogDescription;

  const crumbs = [
    { name: t.product.home, url: `/${lang}` },
    { name: copy.catalogTitle, url: `/${lang}/catalog` },
  ];
  if (activeCat && active !== "all") {
    crumbs.push({
      name: activeCat.label[lang],
      url: `/${lang}/catalog?category=${encodeURIComponent(activeCat.id)}`,
    });
  }

  return (
    <PageShell kind="catalog">
      <JsonLd
        data={generateCollectionPageStructuredData({
          lang,
          name: title,
          description,
          path:
            active !== "all"
              ? `catalog?category=${encodeURIComponent(active)}`
              : "catalog",
          products: products.slice(0, 24).map((p) => ({
            id: p.id,
            name: productName(p, lang),
          })),
          baseUrl,
        })}
      />
      <JsonLd data={generateBreadcrumbStructuredData(crumbs, baseUrl)} />
      <CatalogServer
        lang={lang}
        category={category}
        showCategoryHub={showCategoryHub}
      />
    </PageShell>
  );
}
