import type { Product } from "@/lib/types";

import { normalizeBrandSize } from "@/lib/productSizes";

const DEFAULT_SIZES = ["ONESIZE", "XS-S", "S-M", "M-L", "L-XL", "A", "B", "C", "D"];

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

/** Can be added to basket / checkout (in stock or sew-in-14-days). */
export function isSellableProduct(p: Product): boolean {
  return (
    isRealProduct(p) && (Boolean(p.inStock) || Boolean(p.madeToOrder))
  );
}

export function normalizeSizeOptions(
  sizes: string[] | null | undefined
): string[] {
  if (Array.isArray(sizes) && sizes.length > 0) {
    return sizes.map(normalizeBrandSize).filter(Boolean);
  }
  return [...DEFAULT_SIZES];
}
