import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { readOrders, readProducts } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const [products, orders] = await Promise.all([readProducts(), readOrders()]);
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const newOrders = orders.filter((o) => o.status === "new").length;

  return NextResponse.json({
    products: products.length,
    inStock: products.filter((p) => p.inStock).length,
    orders: orders.length,
    newOrders,
    revenue,
    recentOrders: orders.slice(0, 8),
  });
}
