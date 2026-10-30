import type { Locale } from "@/lib/i18n/config";
import type { MediaAdjust } from "@/lib/mediaAdjust";

export interface ProductSwatch {
  img: string;
  label: string;
  hex?: string;
}

/** Sibling product in the same color family (brand palette switcher). */
export interface ProductColorVariant {
  id: string;
  name: string;
  color: string;
  image: string;
  hex?: string;
  /** Fixed brand palette slot id (pink, black, …). */
  paletteId?: string | null;
}

export type ProductMediaType = "image" | "video";

export interface ProductMedia {
  url: string;
  type: ProductMediaType;
  width?: number;
  height?: number;
  adjust?: MediaAdjust;
}

export interface Product {
  id: string;
  /** Display name (UK) — kept for backward compat. */
  name: string;
  nameEn?: string;
  sizes: string;
  sizeOptions: string[];
  /** Optional length variants (mini / midi / …). Hidden on PDP if empty. */
  lengthOptions?: string[];
  /** Optional material variants. Hidden on PDP if empty. */
  materialOptions?: string[];
  price: string;
  priceNum: number;
  /** Explicit EUR price; if omitted, derived from UAH. */
  priceEur?: number | null;
  /** Explicit USD price (optional). */
  priceUsd?: number | null;
  /** Old/compare-at price in UAH (for sale strikethrough). */
  compareAtPriceNum?: number | null;
  color: string;
  colorHex?: string;
  material: string;
  description: string;
  descriptionEn?: string;
  longDescription: string;
  longDescriptionEn?: string;
  shortDescription?: string;
  /** Size worn in photos, e.g. "S" / "M on model". */
  photoSize?: string;
  /** Free-text model params (height, measurements…). */
  modelParams?: string;
  images: string[];
  media?: ProductMedia[];
  swatches: ProductSwatch[];
  inStock: boolean;
  /** «Зшиємо за 14 днів» — shown on PDP with in-stock status. */
  madeToOrder?: boolean;
  /** When false, product is hidden from catalog / search / home rails (PDP still works). */
  isVisible?: boolean;
  sku: number | string;
  category?: string;
  isNew?: boolean;
  isPopular?: boolean;
  isSale?: boolean;
  /** Catalog display priority — lower shows first (default order). */
  sortOrder?: number;
  colorGroup?: string | null;
  colorVariants?: ProductColorVariant[];
  lookProductIds?: string[];
  /** ISO timestamp from DB — used for «новинки» without manual New flag. */
  createdAt?: string;
}

export function productName(p: Product, lang: Locale): string {
  if (lang === "en" && p.nameEn?.trim()) return p.nameEn.trim();
  return p.name;
}

export function productDescription(p: Product, lang: Locale): string {
  if (lang === "en") {
    return (
      p.descriptionEn?.trim() ||
      p.longDescriptionEn?.trim() ||
      p.description ||
      p.longDescription ||
      ""
    );
  }
  return p.description || p.longDescription || "";
}

export interface BasketItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  /** Unique variant key (and legacy display fallback). */
  size: string;
  /** Actual selected size, when structured fields are present. */
  sizeLabel?: string;
  length?: string;
  material?: string;
  color?: string;
  quantity: number;
  image: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: string;
  priceNum: number;
  image: string;
}

export type DeliveryMethod =
  | "nova_poshta_branch"
  | "nova_poshta_locker"
  | "nova_poshta_courier"
  | "pickup"
  | "international";

export type PaymentType = "full" | "prepay" | "pay_after";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface CheckoutPayload {
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  paymentType: PaymentType;
  city: string;
  address: string;
  comment?: string;
  locale: string;
  items: Array<{
    productId: string;
    name: string;
    size: string;
    sizeLabel?: string;
    length?: string;
    material?: string;
    color?: string;
    quantity: number;
    priceNum: number;
    image?: string;
  }>;
}
