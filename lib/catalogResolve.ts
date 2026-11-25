import type { Category, CategoryId } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";

/** Collections that filter by product flags / dates, not `products.category`. */
const VIRTUAL_COLLECTIONS = new Set<CategoryId>(["new", "sale"]);

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
  if (active === "new") {
    return categories.find((c) => c.id === "new") ?? FALLBACK_NEW;
  }
  if (active === "sale") {
    return categories.find((c) => c.id === "sale") ?? FALLBACK_SALE;
  }
  return categories.find((c) => c.id === active);
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