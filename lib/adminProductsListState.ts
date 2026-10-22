export type StockFilter = "all" | "in" | "out";
export type VisibilityFilter = "all" | "visible" | "hidden";

export type AdminProductsListState = {
  q: string;
  cat: string;
  stock: StockFilter;
  vis: VisibilityFilter;
  page: number;
};

export const ADMIN_PRODUCTS_LIST_DEFAULT: AdminProductsListState = {
  q: "",
  cat: "",
  stock: "all",
  vis: "all",
  page: 1,
};

const STORAGE_KEY = "lc-admin-products-list";

function parseStock(v: string | null | undefined): StockFilter {
  return v === "in" || v === "out" ? v : "all";
}

function parseVis(v: string | null | undefined): VisibilityFilter {
  return v === "visible" || v === "hidden" ? v : "all";
}

function parsePage(v: string | null | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function parseAdminProductsListState(
  source: URLSearchParams | Record<string, string | undefined> | null | undefined
): AdminProductsListState {
  if (!source) return { ...ADMIN_PRODUCTS_LIST_DEFAULT };
  const get =
    source instanceof URLSearchParams
      ? (key: string) => source.get(key) ?? undefined
      : (key: string) => source[key];
  return {
    q: String(get("q") ?? "").trim(),
    cat: String(get("cat") ?? "").trim(),
    stock: parseStock(get("stock")),
    vis: parseVis(get("vis")),
    page: parsePage(get("page")),
  };
}

export function adminProductsListHasParams(
  source: URLSearchParams | null | undefined
): boolean {
  if (!source) return false;
  return (
    source.has("q") ||
    source.has("cat") ||
    source.has("stock") ||
    source.has("vis") ||
    source.has("page")
  );
}

export function serializeAdminProductsListState(
  state: AdminProductsListState
): string {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) params.set("q", q);
  if (state.cat) params.set("cat", state.cat);
  if (state.stock !== "all") params.set("stock", state.stock);
  if (state.vis !== "all") params.set("vis", state.vis);
  if (state.page > 1) params.set("page", String(state.page));
  return params.toString();
}

export function getAdminProductsListHref(
  state?: AdminProductsListState | null
): string {
  const resolved = state ?? readAdminProductsListState();
  const qs = serializeAdminProductsListState(
    resolved ?? ADMIN_PRODUCTS_LIST_DEFAULT
  );
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export function readAdminProductsListState(): AdminProductsListState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AdminProductsListState>;
    return {
      q: String(parsed.q ?? "").trim(),
      cat: String(parsed.cat ?? "").trim(),
      stock: parseStock(parsed.stock),
      vis: parseVis(parsed.vis),
      page: parsePage(String(parsed.page ?? 1)),
    };
  } catch {
    return null;
  }
}

export function writeAdminProductsListState(
  state: AdminProductsListState
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}
