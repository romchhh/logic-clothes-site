export type AdminProductsSort =
  | "default"
  | "price-asc"
  | "price-desc"
  | "date-desc"
  | "date-asc";

export type AdminProductsListState = {
  q: string;
  cat: string;
  sort: AdminProductsSort;
  page: number;
};

export const ADMIN_PRODUCTS_LIST_DEFAULT: AdminProductsListState = {
  q: "",
  cat: "",
  sort: "default",
  page: 1,
};

/** Always clean list URL — filters are session-local and not restored. */
export function getAdminProductsListHref(): string {
  return "/admin/products";
}

export function parseAdminProductsSort(
  v: string | null | undefined
): AdminProductsSort {
  if (
    v === "price-asc" ||
    v === "price-desc" ||
    v === "date-desc" ||
    v === "date-asc"
  ) {
    return v;
  }
  return "default";
}
