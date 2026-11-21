import type { Product } from "@/lib/types";

/** Products appear in «найновіше» for this long after creation (even without the New flag). */
export const NEW_ARRIVAL_WINDOW_MS = 180 * 24 * 60 * 60 * 1000;

export function productOnSale(p: Product): boolean {
  return (
    Boolean(p.isSale) ||
    (p.compareAtPriceNum != null && p.compareAtPriceNum > p.priceNum)
  );
}

export function productCreatedAtMs(p: Product): number {
  if (!p.createdAt) return 0;
  const t = new Date(p.createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Newest uploads first. */
export function sortByNewestFirst(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const tb = productCreatedAtMs(b);
    const ta = productCreatedAtMs(a);
    if (tb !== ta) return tb - ta;
    return a.id.localeCompare(b.id);
  });
}

export function productInNewSection(p: Product, now = Date.now()): boolean {
  if (p.isNew) return true;
  const t = productCreatedAtMs(p);
  if (!t) return false;
  return now - t <= NEW_ARRIVAL_WINDOW_MS;
}

/**
 * «Найновіше»: recent uploads (flag or window), newest first.
 * If nothing matches the window, still show the catalog by upload date
 * so the section is never empty after a bulk import.
 */
export function productsForNewestSection(
  products: Product[],
  opts?: { limit?: number; now?: number }
): Product[] {
  const now = opts?.now ?? Date.now();
  const sorted = sortByNewestFirst(products);
  const recent = sorted.filter((p) => productInNewSection(p, now));
  const list = recent.length ? recent : sorted;
  return opts?.limit != null ? list.slice(0, opts.limit) : list;
}
