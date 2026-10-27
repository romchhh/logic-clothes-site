import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { applyPricePatch } from "@/lib/adminProductPrices";
import { getProductById, upsertProduct } from "@/lib/adminStore";

export const runtime = "nodejs";

type UpdateRow = {
  id: string;
  priceNum?: number;
  priceEur?: number | null;
  priceUsd?: number | null;
  compareAtPriceNum?: number | null;
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

    const results: { id: string; ok: boolean; error?: string }[] = [];

    for (const row of updates) {
      const id = String(row.id || "").trim();
      if (!id) {
        results.push({ id: "", ok: false, error: "missing_id" });
        continue;
      }
      const current = await getProductById(id);
      if (!current) {
        results.push({ id, ok: false, error: "not_found" });
        continue;
      }

      const patch: Partial<{
        priceNum: number;
        priceEur: number | null;
        priceUsd: number | null;
        compareAtPriceNum: number | null;
      }> = {};

      if (row.priceNum !== undefined) {
        const n = Number(row.priceNum);
        if (!Number.isFinite(n) || n < 0) {
          results.push({ id, ok: false, error: "invalid_price" });
          continue;
        }
        patch.priceNum = n;
      }
      if (row.priceEur !== undefined) {
        if (row.priceEur === null) {
          patch.priceEur = null;
        } else {
          const e = Number(row.priceEur);
          patch.priceEur = Number.isFinite(e) && e > 0 ? e : null;
        }
      }
      if (row.priceUsd !== undefined) {
        if (row.priceUsd === null) {
          patch.priceUsd = null;
        } else {
          const u = Number(row.priceUsd);
          patch.priceUsd = Number.isFinite(u) && u > 0 ? u : null;
        }
      }
      if (row.compareAtPriceNum !== undefined) {
        if (row.compareAtPriceNum === null) {
          patch.compareAtPriceNum = null;
        } else {
          const c = Number(row.compareAtPriceNum);
          patch.compareAtPriceNum =
            Number.isFinite(c) && c > 0 ? c : null;
        }
      }

      if (!Object.keys(patch).length) {
        results.push({ id, ok: true });
        continue;
      }

      await upsertProduct(applyPricePatch(current, patch));
      results.push({ id, ok: true });
    }

    const failed = results.filter((r) => !r.ok);
    return NextResponse.json({
      ok: failed.length === 0,
      updated: results.filter((r) => r.ok).length,
      results,
    });
  } catch (error) {
    console.error("[PUT /api/admin/products/prices]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
