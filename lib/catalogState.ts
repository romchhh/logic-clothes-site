export type CatalogSortOrder = "newest" | "asc" | "desc";

export type CatalogPersistedState = {
  sortOrder: CatalogSortOrder;
  selectedSizes: string[];
  selectedColors: string[];
  minPrice: number | null;
  maxPrice: number | null;
  visibleCount: number;
  scrollY: number;
  /** Product opened from the grid — preferred restore target on back. */
  lastProductId: string | null;
};

function storageKey(lang: string, category: string) {
  return `lc_catalog_state_v2:${lang}:${category}`;
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
        16,
        Number.isFinite(Number(data.visibleCount))
          ? Number(data.visibleCount)
          : 16
      ),
      scrollY: Math.max(0, Number(data.scrollY) || 0),
      lastProductId:
        typeof data.lastProductId === "string" && data.lastProductId
          ? data.lastProductId
          : null,
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

/** Snapshot scroll + last product right before leaving the catalog grid. */
export function rememberCatalogExit(
  lang: string,
  category: string,
  patch: Partial<CatalogPersistedState>
): void {
  const current = loadCatalogState(lang, category);
  saveCatalogState(lang, category, {
    sortOrder: patch.sortOrder ?? current?.sortOrder ?? "newest",
    selectedSizes: patch.selectedSizes ?? current?.selectedSizes ?? [],
    selectedColors: patch.selectedColors ?? current?.selectedColors ?? [],
    minPrice:
      patch.minPrice !== undefined ? patch.minPrice : (current?.minPrice ?? null),
    maxPrice:
      patch.maxPrice !== undefined ? patch.maxPrice : (current?.maxPrice ?? null),
    visibleCount: patch.visibleCount ?? current?.visibleCount ?? 16,
    scrollY:
      patch.scrollY !== undefined
        ? patch.scrollY
        : current?.scrollY ?? (window.scrollY || 0),
    lastProductId:
      patch.lastProductId !== undefined
        ? patch.lastProductId
        : (current?.lastProductId ?? null),
  });
}

export function clearCatalogState(lang: string, category: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(storageKey(lang, category));
    // Also drop legacy key if present
    sessionStorage.removeItem(`lc_catalog_state_v1:${lang}:${category}`);
  } catch {
    /* ignore */
  }
}
