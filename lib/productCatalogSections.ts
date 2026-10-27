import type { Product } from "@/lib/types";

/** Products appear in «Новинки» for this long after creation (even without the New flag). */
export const NEW_ARRIVAL_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export function productOnSale(p: Product): boolean {
  return (
    Boolean(p.isSale) ||
    (p.compareAtPriceNum != null && p.compareAtPriceNum > p.priceNum)
  );
}

export function productInNewSection(p: Product, now = Date.now()): boolean {
  if (p.isNew) return true;
  if (!p.createdAt) return false;
  const t = new Date(p.createdAt).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t <= NEW_ARRIVAL_WINDOW_MS;
}
