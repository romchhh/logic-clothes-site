import { formatPriceLabel } from "@/lib/format";
import type { Product } from "@/lib/types";

export type ProductPriceFields = {
  priceNum: number;
  priceEur: number | null;
  priceUsd: number | null;
  compareAtPriceNum: number | null;
};

export function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Display value for optional EUR/USD fields in admin lists. */
export function formatStoredForexPrice(
  value: number | null | undefined
): string {
  if (value == null || value <= 0) return "";
  return String(Math.round(value));
}

export type ForexDraftResult =
  | { kind: "skip" }
  | { kind: "clear" }
  | { kind: "invalid" }
  | { kind: "set"; value: number };

/** Parse inline forex field on blur (empty → clear stored value). */
export function forexDraftToPatch(
  raw: string | undefined,
  stored: number | null | undefined
): ForexDraftResult {
  if (raw === undefined) return { kind: "skip" };
  const trimmed = raw.trim();
  if (!trimmed) {
    if (stored == null || stored <= 0) return { kind: "skip" };
    return { kind: "clear" };
  }
  const parsed = parsePriceInput(trimmed);
  if (parsed == null || parsed <= 0) return { kind: "invalid" };
  if (stored != null && Math.round(stored) === Math.round(parsed)) {
    return { kind: "skip" };
  }
  return { kind: "set", value: parsed };
}

export function applyPricePatch(
  product: Product,
  patch: Partial<ProductPriceFields>
): Product {
  const next = { ...product };
  if (patch.priceNum !== undefined) {
    const n = patch.priceNum;
    if (Number.isFinite(n) && n >= 0) {
      next.priceNum = n;
      next.price = formatPriceLabel(n);
    }
  }
  if (patch.priceEur !== undefined) {
    next.priceEur =
      patch.priceEur != null && patch.priceEur > 0 ? patch.priceEur : null;
  }
  if (patch.priceUsd !== undefined) {
    next.priceUsd =
      patch.priceUsd != null && patch.priceUsd > 0 ? patch.priceUsd : null;
  }
  if (patch.compareAtPriceNum !== undefined) {
    next.compareAtPriceNum =
      patch.compareAtPriceNum != null && patch.compareAtPriceNum > 0
        ? patch.compareAtPriceNum
        : null;
  }
  return next;
}
