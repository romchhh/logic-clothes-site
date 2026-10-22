export type CatalogSortOrder = "newest" | "asc" | "desc";

export type CatalogPersistedState = {
  sortOrder: CatalogSortOrder;
  selectedSizes: string[];
  selectedColors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  visibleCount: number;
  scrollY: number;
};

function storageKey(lang: string, category: string) {
  return `lc_catalog_state_v1:${lang}:${category}`;
}

export function loadCatalogState(
  lang: string,
  category: string
): CatalogPersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(lang, category));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CatalogPersistedState>;
    const sortOrder: CatalogSortOrder | null =
      data.sortOrder === "asc" ||
      data.sortOrder === "desc" ||
      data.sortOrder === "newest"
        ? data.sortOrder
        : null;
    if (!sortOrder) return null;
    return {
      sortOrder,
      selectedSizes: Array.isArray(data.selectedSizes)
        ? data.selectedSizes.map(String)
        : [],
      selectedColors: Array.isArray(data.selectedColors)
        ? data.selectedColors.map(String)
        : [],
      minPrice:
        data.minPrice == null || Number.isFinite(Number(data.minPrice))
          ? data.minPrice == null
            ? null
            : Number(data.minPrice)
          : null,
      maxPrice:
        data.maxPrice == null || Number.isFinite(Number(data.maxPrice))
          ? data.maxPrice == null
            ? null
            : Number(data.maxPrice)
          : null,
      visibleCount: Math.max(
        12,
        Number.isFinite(Number(data.visibleCount))
          ? Number(data.visibleCount)
          : 12
      ),
      scrollY: Math.max(0, Number(data.scrollY) || 0),
    };
  } catch {
    return null;
  }
}

export function saveCatalogState(
  lang: string,
  category: string,
  state: CatalogPersistedState
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(lang, category), JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function clearCatalogState(lang: string, category: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(lang, category));
  } catch {
    /* ignore */
  }
}
