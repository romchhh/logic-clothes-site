import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { readOrders, readProducts } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const [products, orders] = await Promise.all([
      readProducts(),
      readOrders(),
    ]);
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
  } catch (error) {
    console.error("[GET /api/admin/stats]", error);
    const message =
      error instanceof Error ? error.message : "Failed to load stats";
    return NextResponse.json(
      { error: "stats_failed", message },
      { status: 500 }
    );
  }
}
