import type { Product } from "@/lib/types";

/** Approximate UAH→EUR display rate for PDP dual price. */
export const UAH_PER_EUR = 51;

export function formatMoney(n: number): string {
  return n.toLocaleString("uk-UA") + " ₴";
}

export function formatCardPrice(p: Pick<Product, "priceNum" | "price">): string {
  if (typeof p.priceNum === "number") {
    return p.priceNum.toLocaleString("uk-UA") + " грн";
  }
  return String(p.price || "")
    .replace("₴", "грн")
    .trim();
}

export function resolveEur(
  p: Pick<Product, "priceNum" | "price" | "priceEur">
): number {
  if (typeof p.priceEur === "number" && p.priceEur > 0) {
    return Math.round(p.priceEur);
  }
  const uah =
    typeof p.priceNum === "number"
      ? p.priceNum
      : Number(String(p.price).replace(/[^\d]/g, "")) || 0;
  if (uah <= 0) return 0;
  return Math.max(1, Math.round(uah / UAH_PER_EUR));
}

export function formatDualPrice(
  p: Pick<Product, "priceNum" | "price" | "priceEur" | "compareAtPriceNum" | "isSale">
): string {
  const uah =
    typeof p.priceNum === "number"
      ? p.priceNum
      : Number(String(p.price).replace(/[^\d]/g, "")) || 0;
  const eur = resolveEur(p);
  if (eur <= 0) return `${uah.toLocaleString("uk-UA")} грн`;
  return `${uah.toLocaleString("uk-UA")} грн / ${eur} €`;
}
