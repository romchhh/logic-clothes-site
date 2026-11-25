import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";

const NEWEST_LABEL_UK = /найнові|новинк/i;
const NEWEST_LABEL_EN = /newest|new\s*in/i;

/** Collections «найновіше» — not the per-product `products.category` field. */
export function categoryLooksLikeNewest(cat: Category): boolean {
  if (cat.id === "new") return true;
  if (cat.kind !== "collection") return false;
  if (NEWEST_LABEL_UK.test(cat.label.uk)) return true;
  if (NEWEST_LABEL_EN.test(cat.label.en)) return true;
  if (cat.id === "new-ideas" || /^new[-_]/i.test(cat.id)) return true;
  return false;
}

export function categoryLooksLikeSale(cat: Category): boolean {
  return (
    cat.id === "sale" ||
    (cat.kind === "collection" &&
      /sale/i.test(`${cat.label.en} ${cat.label.uk}`))
  );
}

/** Slug for menu / «дивитись усе» when system `new` was recreated as `new-ideas`. */
export function resolveNewestCategoryId(categories: Category[]): string {
  const system = categories.find((c) => c.id === "new");
  if (system) return "new";
  const alt = categories.find(
    (c) => c.isVisible && categoryLooksLikeNewest(c)
  );
  return alt?.id ?? "new";
}

export function isNewestCategoryParam(
  categoryId: string,
  cat: Category | null | undefined
): boolean {
  if (categoryId === "new" || categoryId === "new-ideas") return true;
  if (cat && categoryLooksLikeNewest(cat)) return true;
  return false;
}

/** Canonical `?category=` for collections (newest → always `new` on live DB). */
export function catalogCategoryQueryId(cat: Category): string {
  if (categoryLooksLikeNewest(cat)) return "new";
  if (categoryLooksLikeSale(cat)) return "sale";
  return cat.id;
}

export function catalogCategoryHref(lang: Locale, cat: Category): string {
  const id = catalogCategoryQueryId(cat);
  if (id === "all") return `/${lang}/catalog?category=all`;
  return `/${lang}/catalog?category=${encodeURIComponent(id)}`;
}

export function shouldRedirectNewestSlug(
  category: string | null | undefined,
  cat: Category | null | undefined
): boolean {
  const id = (category ?? "").trim();
  if (!id || id === "new") return false;
  if (!cat || !categoryLooksLikeNewest(cat)) return false;
  return id !== "new";
}

export function isSaleCategoryParam(
  categoryId: string,
  cat: Category | null | undefined
): boolean {
  if (categoryId === "sale") return true;
  if (cat && categoryLooksLikeSale(cat)) return true;
  return false;
}