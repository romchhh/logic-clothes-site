import type { Product } from "@/lib/types";

const DEFAULT_SIZES = ["S", "M", "L"];

/** Real sellable SKU (not a gift certificate / zero-price placeholder). */
export function isRealProduct(p: Product): boolean {
  if (Number(p.priceNum) <= 0) return false;
  if (/^gift/i.test(p.id) || /gift\s*cert/i.test(p.name)) return false;
  return true;
}

/** Visible in catalog / featured / search. */
export function isCatalogProduct(p: Product): boolean {
  return isRealProduct(p) && p.isVisible !== false;
}

/** Can be added to basket / checkout (may still be hidden from catalog). */
export function isSellableProduct(p: Product): boolean {
  return isRealProduct(p) && p.inStock !== false;
}

export function normalizeSizeOptions(
  sizes: string[] | null | undefined
): string[] {
  if (Array.isArray(sizes) && sizes.length > 0) return sizes;
  return [...DEFAULT_SIZES];
}
