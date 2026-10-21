import type { Product } from "@/lib/types";

const DEFAULT_SIZES = ["S", "M", "L"];

/** Visible in catalog / featured / search (exclude free placeholders). */
export function isCatalogProduct(p: Product): boolean {
  if (Number(p.priceNum) <= 0) return false;
  if (/^gift/i.test(p.id) || /gift\s*cert/i.test(p.name)) return false;
  return true;
}

/** Can be added to basket / checkout. */
export function isSellableProduct(p: Product): boolean {
  return isCatalogProduct(p) && p.inStock !== false;
}

export function normalizeSizeOptions(
  sizes: string[] | null | undefined
): string[] {
  if (Array.isArray(sizes) && sizes.length > 0) return sizes;
  return [...DEFAULT_SIZES];
}
