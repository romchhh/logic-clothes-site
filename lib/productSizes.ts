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

/** Map legacy / Cyrillic / typo chips to the Latin brand grid. */
export function normalizeBrandSize(raw: string): string {
  const s = raw.trim();
  if (!s) return s;

  const lower = s.toLowerCase().replace(/\s+/g, "");
  const cyr: Record<string, string> = {
    універсальний: "ONESIZE",
    универсальный: "ONESIZE",
    одинрозмір: "ONESIZE",
    одинразмер: "ONESIZE",
    onesize: "ONESIZE",
  };
  if (cyr[lower]) return cyr[lower];

  // Latinize lookalike Cyrillic letters often typed on UA keyboards.
  const upper = s
    .replace(/[–—−]/g, "-")
    .replace(/[Хх]/g, "X")
    .replace(/[Сс]/g, "C")
    .replace(/[Аа]/g, "A")
    .replace(/[Вв]/g, "B")
    .replace(/[Мм]/g, "M")
    .replace(/[Ѕѕ]/g, "S")
    .toUpperCase()
    .replace(/\s+/g, "");

  const aliases: Record<string, string> = {
    ONESIZE: "ONESIZE",
    "ONE-SIZE": "ONESIZE",
    OS: "ONESIZE",
    "XS-S": "XS-S",
    XSS: "XS-S",
    "XS/S": "XS-S",
    XS: "XS-S",
    "S-M": "S-M",
    SM: "S-M",
    "S/M": "S-M",
    S: "S-M",
    "M-L": "M-L",
    ML: "M-L",
    "M/L": "M-L",
    M: "M-L",
    "L-XL": "L-XL",
    LXL: "L-XL",
    "L/XL": "L-XL",
    L: "L-XL",
    XL: "L-XL",
    A: "A",
    B: "B",
    C: "C",
    D: "D",
  };
  return aliases[upper] ?? aliases[upper.replace(/\//g, "-")] ?? s;
}

/** Suggest Latin brand sizes while typing (for admin inputs). */
export function suggestBrandSizes(query: string, limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...ADMIN_SIZE_PRESETS];
  const normalized = normalizeBrandSize(query);
  const compact = q.replace(/[-\s/]/g, "");
  const scored = ADMIN_SIZE_PRESETS.map((size) => {
    const low = size.toLowerCase();
    let score = 0;
    if (size === normalized) score = 100;
    else if (low.startsWith(q) || low.startsWith(compact)) score = 80;
    else if (low.includes(q)) score = 50;
    else if (low.replace(/-/g, "").includes(compact)) score = 40;
    return { size, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.size.localeCompare(b.size));
  return scored.slice(0, limit).map((x) => x.size);
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
