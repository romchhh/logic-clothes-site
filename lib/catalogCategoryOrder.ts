import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";

export type CatalogNavEntry =
  | { type: "category"; category: Category }
  | { type: "spacer"; key: string };

const ALL_LABEL: Record<Locale, string> = {
  uk: "дивитись усе",
  en: "view all",
};

function localeCollator(lang: Locale) {
  return new Intl.Collator(lang === "uk" ? "uk" : "en", {
    sensitivity: "base",
    numeric: true,
  });
}

function ensureAllCategory(categories: Category[]): Category {
  const fromDb = categories.find((c) => c.id === "all");
  if (fromDb) {
    return {
      ...fromDb,
      label: { uk: ALL_LABEL.uk, en: fromDb.label.en || ALL_LABEL.en },
    };
  }
  return {
    id: "all",
    image: "/assets/products/meshdress-2_255_1.jpg",
    label: { ...ALL_LABEL },
    cta: { uk: "Дивитись", en: "View" },
    kind: "collection",
    sortOrder: 0,
    isVisible: true,
    isSystem: true,
  };
}

function withSaleLabel(cat: Category): Category {
  return {
    ...cat,
    label: { uk: "SALE", en: "SALE" },
  };
}

/** Flat storefront order: дивитись усе → A–Z → SALE */
export function orderCatalogCategories(
  categories: Category[],
  lang: Locale
): Category[] {
  const seen = new Set<string>();
  const visible = categories.filter((c) => {
    if (!c.isVisible || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  const all = ensureAllCategory(visible);
  const saleRaw = visible.find((c) => c.id === "sale");
  const middle = visible
    .filter((c) => c.id !== "all" && c.id !== "sale")
    .slice()
    .sort((a, b) =>
      localeCollator(lang).compare(
        a.label[lang] || a.label.uk,
        b.label[lang] || b.label.uk
      )
    );

  return [
    all,
    ...middle,
    ...(saleRaw ? [withSaleLabel(saleRaw)] : []),
  ];
}

/** Same order with blank spacer rows after «усе» and before SALE. */
export function catalogNavEntries(
  categories: Category[],
  lang: Locale
): CatalogNavEntry[] {
  const ordered = orderCatalogCategories(categories, lang);
  const all = ordered.find((c) => c.id === "all");
  const sale = ordered.find((c) => c.id === "sale");
  const middle = ordered.filter((c) => c.id !== "all" && c.id !== "sale");

  const out: CatalogNavEntry[] = [];
  if (all) out.push({ type: "category", category: all });
  if (middle.length) {
    out.push({ type: "spacer", key: "after-all" });
    const seenLabels = new Set<string>();
    for (const category of middle) {
      const key = catalogCategoryDisplayLabel(category, lang)
        .trim()
        .toLowerCase();
      if (seenLabels.has(key)) continue;
      seenLabels.add(key);
      out.push({ type: "category", category });
    }
  }
  if (sale) {
    out.push({ type: "spacer", key: "before-sale" });
    out.push({ type: "category", category: sale });
  }
  return out;
}

export function catalogCategoryDisplayLabel(
  cat: Category,
  lang: Locale
): string {
  if (cat.id === "sale") return "SALE";
  if (cat.id === "all") return ALL_LABEL[lang] || ALL_LABEL.uk;
  return cat.label[lang] || cat.label.uk;
}
