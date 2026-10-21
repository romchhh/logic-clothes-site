import { NextResponse } from "next/server";
import { isCatalogProduct } from "@/lib/catalogProduct";
import { getProducts } from "@/lib/products";

export const revalidate = 300;

/** Slim payload for search / wishlist — avoids shipping full catalog JSON. */
export async function GET() {
  const products = await getProducts();
  const slim = products.filter(isCatalogProduct).map((p) => ({
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    price: p.price,
    priceNum: p.priceNum,
    compareAtPriceNum: p.compareAtPriceNum,
    images: p.images.slice(0, 1),
    sku: p.sku,
    inStock: p.inStock,
    sizeOptions: p.sizeOptions,
    category: p.category,
    isNew: p.isNew,
    isPopular: p.isPopular,
    isSale: p.isSale,
  }));
  return NextResponse.json(slim, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Content-Type": "application/json",
    },
  });
}
