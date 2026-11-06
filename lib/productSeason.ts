import type { Category } from "@/lib/categories";

/** Warm / cold season for apparel. Null = unset (shown only in «усі»). */
export type ProductSeason = "summer" | "winter";

export type SeasonFilter = "all" | ProductSeason;

const SEASONLESS_IDS = new Set([
  "accessories",
  "bags",
  "bag",
  "belts",
  "belt",
  "belt-accessories",
  "headwear",
  "hats",
  "scarves",
  "jewelry",
]);

const SEASONLESS_LABEL =
  /аксесуар|сумк|шопер|пояс|головн|убор|шапк|хустк|шарф|accessori|bag|belt|hat|headwear|scarf|jewellery|jewelry/i;

export function normalizeProductSeason(raw: unknown): ProductSeason | null {
  if (raw === "summer" || raw === "winter") return raw;
  return null;
}

export function normalizeSeasonFilter(raw: unknown): SeasonFilter {
  if (raw === "summer" || raw === "winter") return raw;
  return "all";
}

/** Hide season UI for bags / accessories / headwear-style categories. */
export function categorySupportsSeasonFilter(
  categoryId: string,
  categories?: Category[]
): boolean {
  if (!categoryId || categoryId === "all" || categoryId === "new" || categoryId === "sale") {
    // Collections / «all» — show filter (apparel-heavy grids).
    return true;
  }
  if (SEASONLESS_IDS.has(categoryId)) return false;
  const cat = categories?.find((c) => c.id === categoryId);
  const blob = `${categoryId} ${cat?.label.uk ?? ""} ${cat?.label.en ?? ""}`;
  return !SEASONLESS_LABEL.test(blob);
}

export function productMatchesSeasonFilter(
  season: ProductSeason | null | undefined,
  filter: SeasonFilter
): boolean {
  if (filter === "all") return true;
  return season === filter;
}
