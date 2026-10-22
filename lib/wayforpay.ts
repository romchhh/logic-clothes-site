import crypto from "crypto";
import {
  PREPAY_AMOUNT_UAH,
  type PaymentType,
} from "@/lib/paymentConstants";

export { PREPAY_AMOUNT_UAH, PAYMENT_TYPES } from "@/lib/paymentConstants";
export type { PaymentType, PaymentStatus } from "@/lib/paymentConstants";

export const WAYFORPAY_PAY_URL = "https://secure.wayforpay.com/pay";

function hmacMd5(secret: string, payload: string): string {
  return crypto.createHmac("md5", secret).update(payload, "utf8").digest("hex");
}

export function getWayForPayConfig() {
  const merchantAccount =
    process.env.WAYFORPAY_MERCHANT_ACCOUNT ||
    process.env.MERCHANT_ACCOUNT ||
    "";
  const merchantSecret =
    process.env.WAYFORPAY_MERCHANT_SECRET || process.env.MERCHANT_SECRET || "";
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PUBLIC_URL ||
    "https://logicclothes.ua"
  ).replace(/\/$/, "");
  const merchantDomainName =
    process.env.WAYFORPAY_MERCHANT_DOMAIN ||
    process.env.MERCHANT_DOMAIN ||
    (siteUrl.includes("localhost")
      ? "localhost"
      : siteUrl.replace(/^https?:\/\//, ""));

  return { merchantAccount, merchantSecret, merchantDomainName, siteUrl };
}

/** PURCHASE form signature */
export function generatePaymentSignature(params: {
  merchantAccount: string;
  merchantDomainName: string;
  orderReference: string;
  orderDate: number;
  amount: number;
  currency: string;
  productName: string[];
  productCount: number[];
  productPrice: number[];
  secretKey: string;
}): string {
  const productNameStr = params.productName.join(";");
  const productCountStr = params.productCount.join(";");
  const productPriceStr = params.productPrice.map((p) => p.toFixed(2)).join(";");

  const stringToSign = [
    params.merchantAccount,
    params.merchantDomainName,
    params.orderReference,
    String(params.orderDate),
    params.amount.toFixed(2),
    params.currency,
    productNameStr,
    productCountStr,
    productPriceStr,
  ].join(";");

  return hmacMd5(params.secretKey, stringToSign);
}

export function verifyWebhookSignature(params: {
  merchantAccount: string;
  orderReference: string;
  amount: number;
  currency: string;
  authCode: string;
  cardPan: string;
  transactionStatus: string;
  reasonCode: number;
  secretKey: string;
  receivedSignature: string;
}): boolean {
  const stringToSign = [
    params.merchantAccount,
    params.orderReference,
    params.amount.toFixed(2),
    params.currency,
    params.authCode,
    params.cardPan,
    params.transactionStatus,
    String(params.reasonCode),
  ].join(";");

  return hmacMd5(params.secretKey, stringToSign) === params.receivedSignature;
}

export function generateWebhookResponseSignature(params: {
  orderReference: string;
  status: string;
  time: number;
  secretKey: string;
}): string {
  const stringToSign = [
    params.orderReference,
    params.status,
    String(params.time),
  ].join(";");
  return hmacMd5(params.secretKey, stringToSign);
}

export function amountToPayFor(
  paymentType: PaymentType,
  orderTotal: number
): number {
  if (paymentType === "prepay") return PREPAY_AMOUNT_UAH;
  if (paymentType === "pay_after") return 0;
  return Math.max(0, Math.round(orderTotal * 100) / 100);
}

export function buildWayForPayPaymentData(opts: {
  orderReference: string;
  amount: number;
  productName: string[];
  productCount: number[];
  productPrice: number[];
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  locale: string;
  returnUrl: string;
  serviceUrl: string;
}): Record<string, string | number | string[] | number[]> | null {
  const { merchantAccount, merchantSecret, merchantDomainName } =
    getWayForPayConfig();
  if (!merchantAccount || !merchantSecret) return null;

  const orderDate = Math.floor(Date.now() / 1000);
  const currency = "UAH";
  const merchantSignature = generatePaymentSignature({
    merchantAccount,
    merchantDomainName,
    orderReference: opts.orderReference,
    orderDate,
    amount: opts.amount,
    currency,
    productName: opts.productName,
    productCount: opts.productCount,
    productPrice: opts.productPrice,
    secretKey: merchantSecret,
  });

  const paymentData: Record<string, string | number | string[] | number[]> = {
    merchantAccount,
    merchantAuthType: "SimpleSignature",
    merchantDomainName,
    merchantTransactionType: "AUTO",
    merchantTransactionSecureType: "AUTO",
    merchantSignature,
    apiVersion: 1,
    language: opts.locale === "en" ? "EN" : "UA",
    orderReference: opts.orderReference,
    orderDate,
    amount: opts.amount.toFixed(2),
    currency,
    productName: opts.productName,
    productCount: opts.productCount,
    productPrice: opts.productPrice.map((p) => p.toFixed(2)),
    returnUrl: opts.returnUrl,
    serviceUrl: opts.serviceUrl,
  };

  const nameParts = opts.customerName.trim().split(/\s+/);
  if (nameParts.length >= 2) {
    paymentData.clientFirstName = nameParts[0];
    paymentData.clientLastName = nameParts.slice(1).join(" ");
  } else if (opts.customerName.trim()) {
    paymentData.clientFirstName = opts.customerName.trim();
  }
  if (opts.customerEmail) paymentData.clientEmail = opts.customerEmail;
  if (opts.customerPhone) paymentData.clientPhone = opts.customerPhone;

  return paymentData;
}
