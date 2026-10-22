import type { Locale } from "@/lib/i18n/config";
import { getSiteUrl } from "@/lib/i18n/seo";
import {
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_MAP_COORDS,
  SITE_NAME,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";
import {
  productDescription,
  productName,
  type Product,
} from "@/lib/types";

const LOGO_PATH = "/assets/logo-header.png";
const OG_IMAGE_PATH = "/assets/hero.png";

function absUrl(path: string, baseUrl = getSiteUrl()) {
  if (!path) return baseUrl;
  if (path.startsWith("http")) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function generateOrganizationStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: absUrl(LOGO_PATH, baseUrl),
      width: 512,
      height: 512,
    },
    image: absUrl(OG_IMAGE_PATH, baseUrl),
    description:
      "Logic Clothes — український бренд жіночого одягу. Concept store у Києві.",
    foundingDate: "2015",
    inLanguage: ["uk", "en"],
    sameAs: [SITE_INSTAGRAM],
    email: SITE_EMAIL,
    telephone: SITE_PHONE,
    address: {
      "@type": "PostalAddress",
      addressCountry: "UA",
      addressLocality: "Київ",
      streetAddress: "вул. Софіївська, 5",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: SITE_PHONE_DISPLAY,
        email: SITE_EMAIL,
        contactType: "customer service",
        areaServed: "UA",
        availableLanguage: ["Ukrainian", "English"],
      },
    ],
  };
}

/** Concept store as ClothingStore / LocalBusiness for local SEO. */
export function generateStoreStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": ["ClothingStore", "Store"],
    "@id": `${baseUrl}/#store`,
    name: `${SITE_NAME} Concept store`,
    url: `${baseUrl}/uk/about`,
    image: absUrl(OG_IMAGE_PATH, baseUrl),
    description:
      "Concept store Logic Clothes у Києві — жіночий одяг обмежених тиражів.",
    telephone: SITE_PHONE,
    email: SITE_EMAIL,
    priceRange: "₴₴",
    currenciesAccepted: "UAH",
    paymentAccepted: "Cash, Credit Card",
    address: {
      "@type": "PostalAddress",
      streetAddress: "вул. Софіївська, 5",
      addressLocality: "Київ",
      addressCountry: "UA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_MAP_COORDS.lat,
      longitude: SITE_MAP_COORDS.lng,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${SITE_MAP_COORDS.lat},${SITE_MAP_COORDS.lng}`,
    sameAs: [SITE_INSTAGRAM],
    parentOrganization: { "@id": `${baseUrl}/#organization` },
  };
}

export function generateWebsiteStructuredData(baseUrl = getSiteUrl()) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: SITE_NAME,
    url: baseUrl,
    inLanguage: ["uk", "en"],
    publisher: { "@id": `${baseUrl}/#organization` },
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
  const images = (product.images || []).map((src) => absUrl(src, baseUrl));
  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const name = productName(product, lang);
  const description =
    productDescription(product, lang) ||
    product.shortDescription ||
    `${name} — ${SITE_NAME}`;
  const url = `${baseUrl}/${lang}/product/${product.id}`;
  const price = Number(product.priceNum || 0).toFixed(2);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name,
    description,
    image: images.length ? images : [absUrl(OG_IMAGE_PATH, baseUrl)],
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    sku: String(product.sku || product.id),
    mpn: String(product.sku || product.id),
    category: product.category || "Жіночий одяг",
    material: product.material || undefined,
    color: product.color || undefined,
    itemCondition: "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "UAH",
      price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: priceValidUntil.toISOString().split("T")[0],
      seller: { "@id": `${baseUrl}/#organization` },
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
      item: absUrl(item.url, baseUrl),
    })),
  };
}

export function generateCollectionPageStructuredData(opts: {
  lang: Locale;
  name: string;
  description: string;
  path: string;
  products?: Array<{ id: string; name: string }>;
  baseUrl?: string;
}) {
  const baseUrl = opts.baseUrl ?? getSiteUrl();
  const url = absUrl(`/${opts.lang}/${opts.path.replace(/^\//, "")}`, baseUrl);
  const list = (opts.products || []).slice(0, 24);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    name: opts.name,
    description: opts.description,
    url,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#organization` },
    ...(list.length
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: list.length,
            itemListElement: list.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${baseUrl}/${opts.lang}/product/${p.id}`,
              name: p.name,
            })),
          },
        }
      : {}),
  };
}

export function generateAboutPageStructuredData(
  lang: Locale,
  title: string,
  description: string,
  baseUrl = getSiteUrl()
) {
  const url = `${baseUrl}/${lang}/about`;
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${url}#about`,
    name: title,
    description,
    url,
    isPartOf: { "@id": `${baseUrl}/#website` },
    about: { "@id": `${baseUrl}/#organization` },
    mainEntity: { "@id": `${baseUrl}/#store` },
  };
}
