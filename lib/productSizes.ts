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

/** Default «зшиємо за 14 днів» row on PDP — full brand grid. */
export const MADE_TO_ORDER_SIZE_GRID = [...ADMIN_SIZE_PRESETS] as const;

/** Canonical order for catalog size filter chips. */
export const CATALOG_SIZE_ORDER = [...ADMIN_SIZE_PRESETS] as const;

/** Keep hyphen visible (no soft wrap / letter-spacing crush). */
export function formatSizeLabel(size: string): string {
  return size.replace(/-/g, "\u2011");
}

/** Map legacy S/M/L chips to the brand grid when possible. */
export function normalizeBrandSize(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  const upper = s.toUpperCase().replace(/\s+/g, "");
  const aliases: Record<string, string> = {
    ONESIZE: "ONESIZE",
    "ONE-SIZE": "ONESIZE",
    OS: "ONESIZE",
    "XS-S": "XS-S",
    XSS: "XS-S",
    XS: "XS-S",
    "S-M": "S-M",
    SM: "S-M",
    S: "S-M",
    "M-L": "M-L",
    ML: "M-L",
    M: "M-L",
    "L-XL": "L-XL",
    LXL: "L-XL",
    L: "L-XL",
    XL: "L-XL",
    A: "A",
    B: "B",
    C: "C",
    D: "D",
  };
  return aliases[upper] ?? s;
}

/** Dedupe + sort sizes into brand grid order (unknowns last). */
export function orderBrandSizes(sizes: Iterable<string>): string[] {
  const unique = Array.from(
    new Set(
      [...sizes].map((s) => normalizeBrandSize(String(s))).filter(Boolean)
    )
  );
  return unique.sort((a, b) => {
    const ia = (CATALOG_SIZE_ORDER as readonly string[]).indexOf(a);
    const ib = (CATALOG_SIZE_ORDER as readonly string[]).indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, "uk");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
