import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  buildCustomerDetail,
  normalizeCustomerPhone,
} from "@/lib/adminCustomers";
import { readOrders } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const { id: raw } = await params;
  const id = normalizeCustomerPhone(decodeURIComponent(raw || ""));
  if (!id) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const orders = await readOrders();
  const customer = buildCustomerDetail(orders, id);
  if (!customer) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}
