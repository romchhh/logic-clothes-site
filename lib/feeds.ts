import { isCatalogProduct } from "@/lib/catalogProduct";
import { getCategories } from "@/lib/categories";
import { getSiteUrl } from "@/lib/i18n/seo";
import type { Locale } from "@/lib/i18n/config";
import { getProducts } from "@/lib/products";
import { resolveSetting } from "@/lib/settings";
import { SITE_NAME } from "@/lib/siteContact";
import type { Product } from "@/lib/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(base: string, path: string): string {
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

async function siteBase(): Promise<string> {
  const fromSettings = await resolveSetting("site_url", [
    process.env.NEXT_PUBLIC_SITE_URL,
  ]);
  return (fromSettings || getSiteUrl()).replace(/\/$/, "");
}

function productTitle(p: Product, lang: Locale): string {
  // Catalog stores one name; keep it, optionally prefix color for uniqueness.
  if (lang === "en" && p.color) {
    return `${p.name} — ${p.color}`;
  }
  return p.color ? `${p.name} — ${p.color}` : p.name;
}

function productDescription(p: Product): string {
  return (
    p.shortDescription ||
    p.description ||
    p.longDescription ||
    p.name
  ).slice(0, 5000);
}

export async function buildGoogleMerchantXml(lang: Locale): Promise<string> {
  const base = await siteBase();
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const catLabel = new Map(
    categories.map((c) => [c.id, c.label[lang] || c.label.uk])
  );

  const items = products
    .filter((p) => isCatalogProduct(p) && p.images.length > 0 && p.priceNum > 0)
    .map((p) => {
      const link = `${base}/${lang}/product/${encodeURIComponent(p.id)}`;
      const image = absoluteUrl(base, p.images[0]);
      const additional = p.images
        .slice(1, 10)
        .map(
          (src) =>
            `<g:additional_image_link>${escapeXml(absoluteUrl(base, src))}</g:additional_image_link>`
        )
        .join("\n");
      const availability = p.inStock ? "in_stock" : "out_of_stock";
      const productType = p.category
        ? escapeXml(catLabel.get(p.category) || p.category)
        : "";

      return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(productTitle(p, lang))}</g:title>
      <g:description>${escapeXml(productDescription(p))}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      ${additional}
      <g:availability>${availability}</g:availability>
      <g:price>${Number(p.priceNum || 0).toFixed(2)} UAH</g:price>
      <g:brand>${escapeXml(SITE_NAME)}</g:brand>
      <g:condition>new</g:condition>
      ${p.color ? `<g:color>${escapeXml(p.color)}</g:color>` : ""}
      ${
        p.sizeOptions?.length
          ? `<g:size>${escapeXml(p.sizeOptions.join("/"))}</g:size>`
          : ""
      }
      ${productType ? `<g:product_type>${productType}</g:product_type>` : ""}
      <g:identifier_exists>false</g:identifier_exists>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(SITE_NAME)} — Google (${lang})</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(`${SITE_NAME} product feed (${lang})`)}</description>
    ${items}
  </channel>
</rss>
`;
}

/** Meta / Facebook catalog — Google Shopping XML (accepted by Commerce Manager). */
export async function buildMetaCatalogXml(lang: Locale): Promise<string> {
  // Same structure works for Meta when using "Google format" schedule.
  return buildGoogleMerchantXml(lang);
}
