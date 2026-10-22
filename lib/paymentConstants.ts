/** Shared checkout payment constants (safe for client + server). */
export const PREPAY_AMOUNT_UAH = 200;

export type PaymentType = "full" | "prepay" | "pay_after";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export const PAYMENT_TYPES = new Set<PaymentType>([
  "full",
  "prepay",
  "pay_after",
]);
