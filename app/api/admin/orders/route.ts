import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { appendOrder, readOrders, type StoredOrder } from "@/lib/adminStore";
import type { DeliveryMethod } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const orders = await readOrders();
  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const total = items.reduce(
      (sum: number, item: { priceNum?: number; quantity?: number }) =>
        sum + (Number(item.priceNum) || 0) * (Number(item.quantity) || 1),
      0
    );

    const order: StoredOrder = {
      id: String(body.id || `LC-${Date.now().toString(36).toUpperCase()}`),
      createdAt: new Date().toISOString(),
      status: (body.status as StoredOrder["status"]) || "new",
      customerName: String(body.customerName || "").trim(),
      phone: String(body.phone || "").trim(),
      email: body.email ? String(body.email) : undefined,
      deliveryMethod: (body.deliveryMethod ||
        "nova_poshta_branch") as DeliveryMethod,
      city: String(body.city || ""),
      address: String(body.address || ""),
      comment: body.comment ? String(body.comment) : undefined,
      locale: String(body.locale || "uk"),
      items,
      total,
    };

    await appendOrder(order);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/orders]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
