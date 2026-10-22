import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "@/components/product/ProductClient";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import {
  parseLangParam,
  pageAlternates,
  getSiteUrl,
  OG_LOCALE,
} from "@/lib/i18n/seo";
import { getProductById, getRelatedProducts } from "@/lib/products";
import { formatCardPrice } from "@/lib/format";
import { getMessages } from "@/lib/i18n/messages";
import {
  generateBreadcrumbStructuredData,
  generateProductStructuredData,
} from "@/lib/seo";
import { SITE_NAME } from "@/lib/siteContact";
import { productDescription, productName } from "@/lib/types";

/** ISR on demand — avoid prebuilding 500+ PDP pages at compile time. */
export const revalidate = 300;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { lang: raw, id } = await params;
  const lang = parseLangParam(raw);
  const product = await getProductById(id);
  if (!product) return { title: "Not found" };

  const base = getSiteUrl();
  const title = productName(product, lang);
  const description =
    productDescription(product, lang) ||
    `${title} — ${formatCardPrice(product)}. ${SITE_NAME}.`;
  const imageUrl = product.images[0]
    ? product.images[0].startsWith("http")
      ? product.images[0]
      : `${base}${product.images[0]}`
    : `${base}/assets/hero.png`;

  return {
    title,
    description,
    alternates: pageAlternates(lang, `product/${id}`),
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "website",
      url: `${base}/${lang}/product/${id}`,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      images: [{ url: imageUrl, width: 1200, height: 1500, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [imageUrl],
    },
    other: {
      "og:type": "product",
      "product:price:amount": Number(product.priceNum || 0).toFixed(2),
      "product:price:currency": "UAH",
      "product:availability": product.inStock ? "in stock" : "out of stock",
      "product:brand": SITE_NAME,
      "product:retailer_item_id": String(product.sku || product.id),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang: raw, id } = await params;
  const lang = parseLangParam(raw);
  const product = await getProductById(id);
  if (!product) notFound();

  const related = await getRelatedProducts(id, 4);
  const t = getMessages(lang);
  const baseUrl = getSiteUrl();

  return (
    <PageShell kind="product">
      <JsonLd data={generateProductStructuredData(product, lang, baseUrl)} />
      <JsonLd
        data={generateBreadcrumbStructuredData(
          [
            { name: t.product.home, url: `/${lang}` },
            { name: t.product.catalog, url: `/${lang}/catalog` },
            {
              name: productName(product, lang),
              url: `/${lang}/product/${id}`,
            },
          ],
          baseUrl
        )}
      />
      <ProductClient product={product} related={related} lang={lang} />
    </PageShell>
  );
}
