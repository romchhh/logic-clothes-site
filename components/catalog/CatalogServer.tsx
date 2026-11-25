import CatalogCategoryHub from "@/components/catalog/CatalogCategoryHub";
import CatalogClient from "@/components/catalog/CatalogClient";
import {
  collectColors,
  collectSizes,
  priceBounds,
} from "@/lib/catalogFilters";
import { getCategories, type CategoryId } from "@/lib/categories";
import { resolveCatalogCategory } from "@/lib/catalogResolve";
import type { Locale } from "@/lib/i18n/config";
import { getProductsByCategory } from "@/lib/products";

export default async function CatalogServer({
  lang,
  category,
  showCategoryHub = false,
}: {
  lang: Locale;
  category?: string | null;
  showCategoryHub?: boolean;
}) {
  const categories = await getCategories();
  if (showCategoryHub) {
    const allProducts = await getProductsByCategory("all");
    return (
      <CatalogCategoryHub
        lang={lang}
        categories={categories}
        sizes={collectSizes(allProducts)}
        colors={collectColors(allProducts)}
        priceHint={priceBounds(allProducts)}
        productCount={allProducts.length}
      />
    );
  }
  const active: CategoryId = resolveCatalogCategory(category, categories);
  const products = await getProductsByCategory(active);
  const sizes = collectSizes(products);
  const colors = collectColors(products);
  const bounds = priceBounds(products);

  return (
    <CatalogClient
      key={active}
      products={products}
      category={active}
      categories={categories}
      sizes={sizes}
      colors={colors}
      priceHint={bounds}
      lang={lang}
    />
  );
}
