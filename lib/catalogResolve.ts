import type { Category, CategoryId } from "@/lib/categories";
import {
  categoryLooksLikeNewest,
  categoryLooksLikeSale,
} from "@/lib/catalogCollections";
import type { Locale } from "@/lib/i18n/config";

/** URL params that work even when the row is missing from `categories`. */
const VIRTUAL_COLLECTIONS = new Set<CategoryId>(["new", "sale", "new-ideas"]);

export function resolveCatalogCategory(
  category: string | null | undefined,
  categories: Category[]
): CategoryId {
  const id = (category ?? "").trim();
  if (!id || id === "all") return "all";
  if (VIRTUAL_COLLECTIONS.has(id)) return id;
  return categories.some((c) => c.id === id) ? id : "all";
}

const FALLBACK_NEW: Category = {
  id: "new",
  image: "/assets/products/coat_257_1.jpg",
  label: { uk: "найновіше", en: "newest" },
  cta: { uk: "До категорії", en: "Shop now" },
  kind: "collection",
  sortOrder: 1,
  isVisible: true,
  isSystem: true,
};

const FALLBACK_SALE: Category = {
  id: "sale",
  image: "/assets/hero.png",
  label: { uk: "SALE", en: "SALE" },
  cta: { uk: "До категорії", en: "Shop now" },
  kind: "collection",
  sortOrder: 999,
  isVisible: true,
  isSystem: true,
};

export function catalogCategoryById(
  categories: Category[],
  active: CategoryId
): Category | undefined {
  const direct = categories.find((c) => c.id === active);
  if (direct) return direct;

  if (active === "new" || active === "new-ideas") {
    const newest =
      categories.find((c) => c.id === "new") ??
      categories.find((c) => categoryLooksLikeNewest(c));
    return newest ?? FALLBACK_NEW;
  }
  if (active === "sale") {
    return (
      categories.find((c) => c.id === "sale") ??
      categories.find((c) => categoryLooksLikeSale(c)) ??
      FALLBACK_SALE
    );
  }
  return undefined;
}

export function catalogActiveTitle(
  categories: Category[],
  active: CategoryId,
  lang: Locale,
  fallback: string
): string {
  const cat = catalogCategoryById(categories, active);
  if (!cat) return fallback;
  if (cat.id === "all") {
    return lang === "uk" ? "дивитись усе" : "view all";
  }
  return cat.label[lang] || cat.label.uk || fallback;
}