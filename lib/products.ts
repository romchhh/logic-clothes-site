import { unstable_cache } from "next/cache";
import { readProducts } from "@/lib/adminStore";
import { isCatalogProduct } from "@/lib/catalogProduct";
import { resolvePaletteId } from "@/lib/colorPalette";
import { isDbUnavailableError } from "@/lib/db";
import { getProductsEpoch } from "@/lib/productCache";
import {
  productInNewSection,
  productOnSale,
} from "@/lib/productCatalogSections";
import type { Product, ProductColorVariant } from "@/lib/types";

/** Strip copy suffixes so colourways of one model share a key. */
export function normalizeModelName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s*\(копія\)\s*/gi, " ")
    .replace(/\s*-\s*copy\b/gi, " ")
    .replace(/\scopy\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSpecificModelName(key: string): boolean {
  const words = key.split(" ").filter(Boolean);
  return words.length >= 2 || key.length >= 12;
}

function toColorVariant(p: Product): ProductColorVariant {
  const hex = p.colorHex || p.swatches[0]?.hex || undefined;
  const paletteId = resolvePaletteId({
    color: p.color,
    colorHex: hex,
  });
  return {
    id: p.id,
    name: p.name,
    color: p.color || p.name,
    image: p.images[0] || "",
    isVisible: p.isVisible !== false,
    ...(hex ? { hex } : {}),
    ...(paletteId ? { paletteId } : {}),
  };
}

function enrichColorVariants(products: Product[]): Product[] {
  const byGroup = new Map<string, Product[]>();
  const byName = new Map<string, Product[]>();

  for (const p of products) {
    if (p.colorGroup) {
      const list = byGroup.get(p.colorGroup) ?? [];
      list.push(p);
      byGroup.set(p.colorGroup, list);
    }
    const key = normalizeModelName(p.name || "");
    if (key && isSpecificModelName(key)) {
      const list = byName.get(key) ?? [];
      list.push(p);
      byName.set(key, list);
    }
  }

  return products.map((p) => {
    const merged = new Map<string, Product>();
    merged.set(p.id, p);

    if (p.colorGroup) {
      for (const s of byGroup.get(p.colorGroup) ?? []) merged.set(s.id, s);
    }

    const nameKey = normalizeModelName(p.name || "");
    if (nameKey && isSpecificModelName(nameKey)) {
      for (const s of byName.get(nameKey) ?? []) {
        // Name fallback: only published colourways (drafts stay out of the switcher)
        if (s.id === p.id || isCatalogProduct(s)) merged.set(s.id, s);
      }
    }

    const colorVariants: ProductColorVariant[] = [...merged.values()].map(
      toColorVariant
    );
    return { ...p, colorVariants };
  });
}

const loadProductsCached = unstable_cache(
  async (_epoch: number): Promise<Product[]> => {
    void _epoch;
    try {
      const products = await readProducts();
      return enrichColorVariants(products);
    } catch (err) {
      if (isDbUnavailableError(err)) {
        console.warn(
          "[products] database not ready (run npm run db:setup):",
          err instanceof Error ? err.message : err
        );
        return [];
      }
      throw err;
    }
  },
  ["logic-clothes-products"],
  { revalidate: 60, tags: ["products"] }
);

/** Server product cache — epoch-busted on admin writes + tag revalidation. */
export async function getProducts(): Promise<Product[]> {
  return loadProductsCached(getProductsEpoch());
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.id === id) ?? null;
}

function sortCatalog(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const sa = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const sb = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (sa !== sb) return sa - sb;
    return a.id.localeCompare(b.id);
  });
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const products = (await getProducts()).filter(isCatalogProduct);
  const popular = products.filter((p) => p.isPopular);
  const neu = products.filter((p) => p.isNew);
  const pool = popular.length
    ? popular
    : neu.length
      ? neu
      : products.filter((p) => p.inStock !== false);
  return sortCatalog(pool.length ? pool : products).slice(0, limit);
}

/** Home page rails: Popular / New / Sale. */
export async function getHomeProductRails(limit = 14): Promise<{
  popular: Product[];
  newcomers: Product[];
  sale: Product[];
}> {
  const products = sortCatalog(
    (await getProducts()).filter(isCatalogProduct)
  );
  const popular = products.filter((p) => p.isPopular).slice(0, limit);
  const newcomers = products.filter((p) => p.isNew).slice(0, limit);
  const sale = products
    .filter(
      (p) =>
        p.isSale ||
        (p.compareAtPriceNum != null && p.compareAtPriceNum > p.priceNum)
    )
    .slice(0, limit);

  return {
    popular: popular.length ? popular : products.slice(0, limit),
    newcomers: newcomers.length ? newcomers : products.slice(0, Math.min(limit, 8)),
    sale,
  };
}

/** Curated look first; otherwise catalog neighbors. */
export async function getRelatedProducts(
  id: string,
  limit = 4
): Promise<Product[]> {
  const products = await getProducts();
  const current = products.find((p) => p.id === id);
  if (current?.lookProductIds?.length) {
    const map = new Map(products.map((p) => [p.id, p]));
    return current.lookProductIds
      .map((rid) => map.get(rid))
      .filter((p): p is Product => !!p && p.id !== id && isCatalogProduct(p))
      .slice(0, limit);
  }
  return products
    .filter((p) => p.id !== id && isCatalogProduct(p))
    .slice(0, limit);
}

export async function getAllProductIds(): Promise<string[]> {
  const products = (await getProducts()).filter(isCatalogProduct);
  return products.map((p) => p.id);
}

export async function getProductsByCategory(
  category?: string | null
): Promise<Product[]> {
  const products = (await getProducts()).filter(isCatalogProduct);
  if (!category || category === "all") return products;
  if (category === "new") return products.filter(productInNewSection);
  if (category === "sale") return products.filter(productOnSale);
  return products.filter((p) => p.category === category);
}
