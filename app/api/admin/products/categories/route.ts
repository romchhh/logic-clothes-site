import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getProductById, upsertProduct } from "@/lib/adminStore";

export const runtime = "nodejs";

type UpdateRow = {
  id: string;
  category?: string;
};

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as { updates?: UpdateRow[] };
    const updates = Array.isArray(body.updates) ? body.updates : [];
    if (!updates.length) {
      return NextResponse.json({ error: "updates_required" }, { status: 400 });
    }

    let updated = 0;
    for (const row of updates) {
      const id = String(row.id || "").trim();
      if (!id) continue;
      const current = await getProductById(id);
      if (!current) continue;

      const cat =
        row.category != null ? String(row.category).trim() : undefined;
      const next = {
        ...current,
        category: cat || undefined,
      };
      await upsertProduct(next);
      updated += 1;
    }

    return NextResponse.json({ ok: true, updated });
  } catch (error) {
    console.error("[PUT /api/admin/products/categories]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
