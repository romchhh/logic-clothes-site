import { NextRequest, NextResponse } from "next/server";
import { appendOrder, getProductById } from "@/lib/adminStore";
import { isSellableProduct } from "@/lib/catalogProduct";
import { sendOrderTelegramNotification } from "@/lib/orderTelegram";
import type {
  CheckoutPayload,
  DeliveryMethod,
  PaymentType,
} from "@/lib/types";
import {
  amountToPayFor,
  buildWayForPayPaymentData,
  getWayForPayConfig,
  PAYMENT_TYPES,
  PREPAY_AMOUNT_UAH,
  WAYFORPAY_PAY_URL,
} from "@/lib/wayforpay";

export const runtime = "nodejs";

const DELIVERY_METHODS = new Set<DeliveryMethod>([
  "nova_poshta_branch",
  "nova_poshta_locker",
  "nova_poshta_courier",
  "pickup",
  "international",
]);

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidPayload(body: unknown): body is CheckoutPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<CheckoutPayload>;
  if (typeof b.customerName !== "string" || b.customerName.trim().length < 2) {
    return false;
  }
  if (typeof b.phone !== "string" || digitsOnly(b.phone).length < 10) {
    return false;
  }
  if (
    typeof b.deliveryMethod !== "string" ||
    !DELIVERY_METHODS.has(b.deliveryMethod as DeliveryMethod)
  ) {
    return false;
  }
  if (
    typeof b.paymentType !== "string" ||
    !PAYMENT_TYPES.has(b.paymentType as PaymentType)
  ) {
    return false;
  }
  if (typeof b.city !== "string" || !b.city.trim()) return false;
  if (typeof b.address !== "string" || !b.address.trim()) return false;
  if (!Array.isArray(b.items) || !b.items.length) return false;
  return b.items.every(
    (item) =>
      item &&
      typeof item.productId === "string" &&
      typeof item.name === "string" &&
      typeof item.size === "string" &&
      Number(item.quantity) >= 1 &&
      Number.isFinite(Number(item.priceNum)) &&
      Number(item.priceNum) > 0
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isValidPayload(body)) {
      return NextResponse.json(
        { error: "invalid_payload" },
        { status: 400 }
      );
    }

    const items = [];
    for (const raw of body.items) {
      const product = await getProductById(String(raw.productId));
      if (!product || !isSellableProduct(product)) {
        return NextResponse.json(
          { error: "item_unavailable", productId: raw.productId },
          { status: 400 }
        );
      }
      const qty = Math.max(1, Math.floor(Number(raw.quantity)));
      const sizeLabel =
        typeof raw.sizeLabel === "string" ? raw.sizeLabel.trim() : undefined;
      const length =
        typeof raw.length === "string" ? raw.length.trim() : undefined;
      const material =
        typeof raw.material === "string" ? raw.material.trim() : undefined;
      const color =
        typeof raw.color === "string"
          ? raw.color.trim()
          : product.color?.trim() || undefined;
      items.push({
        productId: product.id,
        name: String(raw.name || product.name),
        size: String(raw.size),
        ...(sizeLabel ? { sizeLabel } : {}),
        ...(length ? { length } : {}),
        ...(material ? { material } : {}),
        ...(color ? { color } : {}),
        quantity: qty,
        priceNum: Number(product.priceNum),
      });
    }

    const paymentType = body.paymentType as PaymentType;
    const payload: CheckoutPayload = {
      customerName: body.customerName.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || undefined,
      deliveryMethod: body.deliveryMethod,
      paymentType,
      city: body.city.trim(),
      address: body.address.trim(),
      comment: body.comment?.trim() || undefined,
      locale: typeof body.locale === "string" ? body.locale : "uk",
      items,
    };

    const orderId = `LC-${Date.now().toString(36).toUpperCase()}`;
    const total = payload.items.reduce(
      (sum, item) => sum + item.priceNum * item.quantity,
      0
    );
    const amountToPay = amountToPayFor(paymentType, total);
    const needsOnlinePay = paymentType === "full" || paymentType === "prepay";

    try {
      await appendOrder({
        id: orderId,
        createdAt: new Date().toISOString(),
        status: "new",
        customerName: payload.customerName,
        phone: payload.phone,
        email: payload.email,
        deliveryMethod: payload.deliveryMethod,
        paymentType,
        paymentStatus: "pending",
        amountToPay,
        city: payload.city,
        address: payload.address,
        comment: payload.comment,
        locale: payload.locale,
        items: payload.items,
        total,
        notified: false,
      });
    } catch (storeError) {
      console.error("[POST /api/orders] store", storeError);
      return NextResponse.json({ error: "store_failed" }, { status: 500 });
    }

    // Telegram for COD immediately; for card payments also notify (pending)
    const notified = await sendOrderTelegramNotification(payload, orderId, {
      amountToPay,
      paymentPending: needsOnlinePay,
    });
    if (notified) {
      try {
        const { updateOrder } = await import("@/lib/adminStore");
        await updateOrder(orderId, { notified: true });
      } catch {
        /* non-fatal */
      }
    }

    if (!needsOnlinePay) {
      return NextResponse.json({
        ok: true,
        orderId,
        notified,
        paymentType,
        requiresPayment: false,
      });
    }

    const { siteUrl } = getWayForPayConfig();
    const lang = payload.locale === "en" ? "en" : "uk";

    let productName: string[];
    let productCount: number[];
    let productPrice: number[];

    if (paymentType === "prepay") {
      productName = [
        lang === "en"
          ? `Prepayment · order ${orderId}`
          : `Передоплата · замовлення ${orderId}`,
      ];
      productCount = [1];
      productPrice = [PREPAY_AMOUNT_UAH];
    } else {
      productName = payload.items.map((item) => {
        const bits = [item.name];
        if (item.color) bits.push(item.color);
        if (item.sizeLabel || item.size) bits.push(item.sizeLabel || item.size);
        return bits.join(" · ");
      });
      productCount = payload.items.map((item) => item.quantity);
      productPrice = payload.items.map((item) => item.priceNum);
    }

    const paymentData = buildWayForPayPaymentData({
      orderReference: orderId,
      amount: amountToPay,
      productName,
      productCount,
      productPrice,
      customerName: payload.customerName,
      customerEmail: payload.email,
      customerPhone: payload.phone,
      locale: lang,
      returnUrl: `${siteUrl}/${lang}/final?order=${encodeURIComponent(orderId)}&paid=1`,
      serviceUrl: `${siteUrl}/api/wayforpay/webhook`,
    });

    if (!paymentData) {
      console.error("[POST /api/orders] WayForPay credentials missing");
      return NextResponse.json(
        {
          error: "payment_config",
          orderId,
          message: "WayForPay is not configured",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderId,
      notified,
      paymentType,
      requiresPayment: true,
      amountToPay,
      paymentUrl: WAYFORPAY_PAY_URL,
      paymentData,
    });
  } catch (error) {
    console.error("[POST /api/orders]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
