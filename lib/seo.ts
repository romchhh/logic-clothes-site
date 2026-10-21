import type { Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/i18n/seo";
import {
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";
import {
  productDescription,
  productName,
  type Product,
} from "@/lib/types";

export function generateOrganizationStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/assets/logo-header.png`,
    description:
      "Logic Clothes — український бренд жіночого одягу. Concept store у Києві.",
    inLanguage: ["uk", "en"],
    address: {
      "@type": "PostalAddress",
      addressCountry: "UA",
      addressLocality: "Київ",
      streetAddress: "вул. Софіївська, 5",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SITE_PHONE_DISPLAY,
      email: SITE_EMAIL,
      contactType: "customer service",
      availableLanguage: ["Ukrainian", "English"],
    },
  };
}

export function generateWebsiteStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: ["uk", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/uk/catalog?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateProductStructuredData(
  product: Product,
  lang: Locale,
  baseUrl = getSiteUrl()
) {
  const images = (product.images || []).map((src) =>
    src.startsWith("http") ? src : `${baseUrl}${src}`
  );
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const name = productName(product, lang);
  const description =
    productDescription(product, lang) ||
    product.shortDescription ||
    `${name} — ${SITE_NAME}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: images.length ? images : [`${baseUrl}/assets/hero.png`],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    sku: String(product.sku || product.id),
    category: product.category || "Жіночий одяг",
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/${lang}/product/${product.id}`,
      priceCurrency: "UAH",
      price: Number(product.priceNum || 0).toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      priceValidUntil: priceValidUntil.toISOString().split("T")[0],
    },
  };
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
  baseUrl = getSiteUrl()
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}
