/** Admin + storefront size grids */
export const ADMIN_SIZE_PRESETS = [
  "ONESIZE",
  "XS-S",
  "S-M",
  "M-L",
  "L-XL",
  "A",
  "B",
  "C",
  "D",
] as const;

/** Default «зшиємо за 14 днів» row on PDP */
export const MADE_TO_ORDER_SIZE_GRID = [
  "ONESIZE",
  "XS-S",
  "S-M",
  "M-L",
  "L-XL",
  "A",
  "B",
  "C",
  "D",
] as const;

/** Canonical order for catalog size filter chips. */
export const CATALOG_SIZE_ORDER = [...ADMIN_SIZE_PRESETS] as const;
