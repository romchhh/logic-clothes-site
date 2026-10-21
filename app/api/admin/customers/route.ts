import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { buildCustomersFromOrders } from "@/lib/adminCustomers";
import { readOrders } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const orders = await readOrders();
  const customers = buildCustomersFromOrders(orders);
  return NextResponse.json(customers);
}
