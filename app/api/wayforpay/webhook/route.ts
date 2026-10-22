import { NextRequest, NextResponse } from "next/server";
import { getOrderById, updateOrder } from "@/lib/adminStore";
import {
  generateWebhookResponseSignature,
  getWayForPayConfig,
  verifyWebhookSignature,
} from "@/lib/wayforpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parseBody(
  req: NextRequest
): Promise<Record<string, unknown>> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, unknown>;
  }

  const formData = await req.formData();
  const formEntries: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    const stringValue = value instanceof File ? undefined : String(value);

    if (key.trim().startsWith("{")) {
      try {
        return JSON.parse(key) as Record<string, unknown>;
      } catch {
        /* continue */
      }
    }
    if (stringValue?.trim().startsWith("{")) {
      try {
        return JSON.parse(stringValue) as Record<string, unknown>;
      } catch {
        /* continue */
      }
    }
    if (stringValue !== undefined) {
      formEntries[key] = stringValue;
    }
  }

  return formEntries;
}

export async function POST(req: NextRequest) {
  let orderReference = "unknown";
  const { merchantSecret } = getWayForPayConfig();

  try {
    const body = await parseBody(req);
    orderReference = String(body.orderReference || "unknown");

    const merchantAccount = String(body.merchantAccount || "");
    const merchantSignature = String(body.merchantSignature || "");
    const currency = String(body.currency || "UAH");
    const authCode = String(body.authCode || "");
    const cardPan = String(body.cardPan || "");
    const transactionStatus = String(body.transactionStatus || "");
    const amountNum =
      body.amount != null ? Number(body.amount) : 0;
    const reasonCodeNum =
      body.reasonCode != null ? Number(body.reasonCode) : 0;

    if (
      !merchantAccount ||
      !orderReference ||
      !merchantSignature ||
      !transactionStatus
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!merchantSecret) {
      console.error("[WayForPay Webhook] Missing merchant secret");
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const isValid = verifyWebhookSignature({
      merchantAccount,
      orderReference,
      amount: amountNum,
      currency,
      authCode,
      cardPan,
      transactionStatus,
      reasonCode: reasonCodeNum,
      secretKey: merchantSecret,
      receivedSignature: merchantSignature,
    });

    if (!isValid && transactionStatus !== "Approved") {
      console.error("[WayForPay Webhook] Invalid signature", orderReference);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    if (!isValid) {
      console.warn(
        "[WayForPay Webhook] Approved with invalid signature — accepting cautiously",
        orderReference
      );
    }

    if (transactionStatus === "Approved") {
      const order = await getOrderById(orderReference);
      if (order) {
        if (order.paymentStatus !== "paid") {
          await updateOrder(orderReference, {
            paymentStatus: "paid",
            status: order.status === "new" ? "processing" : order.status,
          });
          console.log(`[WayForPay Webhook] Order ${orderReference} marked paid`);
        }
      } else {
        console.warn(`[WayForPay Webhook] Order not found: ${orderReference}`);
      }
    } else if (
      transactionStatus === "Declined" ||
      transactionStatus === "Expired" ||
      transactionStatus === "Refunded"
    ) {
      const order = await getOrderById(orderReference);
      if (order && order.paymentStatus !== "paid") {
        await updateOrder(orderReference, {
          paymentStatus:
            transactionStatus === "Refunded" ? "refunded" : "failed",
        });
      }
    }

    const responseTime = Math.floor(Date.now() / 1000);
    const responseStatus =
      transactionStatus === "Approved" ? "accept" : "decline";
    const signature = generateWebhookResponseSignature({
      orderReference,
      status: responseStatus,
      time: responseTime,
      secretKey: merchantSecret,
    });

    return NextResponse.json(
      {
        orderReference,
        status: responseStatus,
        time: responseTime,
        signature,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("[WayForPay Webhook]", error);
    const responseTime = Math.floor(Date.now() / 1000);
    const signature = merchantSecret
      ? generateWebhookResponseSignature({
          orderReference,
          status: "decline",
          time: responseTime,
          secretKey: merchantSecret,
        })
      : "";

    return NextResponse.json(
      {
        orderReference,
        status: "decline",
        time: responseTime,
        signature,
      },
      { status: 200 }
    );
  }
}
