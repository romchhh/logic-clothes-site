import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  deleteProduct,
  getProductById,
  syncColorVariants,
  upsertProduct,
} from "@/lib/adminStore";
import { applyPricePatch } from "@/lib/adminProductPrices";
import { productFromBody } from "@/lib/productPayload";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const current = await getProductById(id);
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const product = productFromBody(body, {
      ...current,
      id,
      colorVariants: undefined,
    });
    await upsertProduct(product);

    if (Array.isArray(body.colorVariantIds)) {
      await syncColorVariants(
        id,
        (body.colorVariantIds as unknown[]).map(String)
      );
    }

    const fresh = await getProductById(id);
    return NextResponse.json(fresh ?? product);
  } catch (error) {
    console.error("[PUT /api/admin/products/:id]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Partial update for list quick-toggles (stock / visibility). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const current = await getProductById(id);
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    let next = { ...current };
    if (typeof body.inStock === "boolean") next.inStock = body.inStock;
    if (typeof body.isVisible === "boolean") next.isVisible = body.isVisible;

    const pricePatch: {
      priceNum?: number;
      priceEur?: number | null;
      priceUsd?: number | null;
      compareAtPriceNum?: number | null;
    } = {};
    if (body.priceNum !== undefined) {
      const n = Number(body.priceNum);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "invalid_price" }, { status: 400 });
      }
      pricePatch.priceNum = n;
    }
    if (body.priceEur !== undefined) {
      if (body.priceEur === null || body.priceEur === "") {
        pricePatch.priceEur = null;
      } else {
        const e = Number(body.priceEur);
        pricePatch.priceEur = Number.isFinite(e) && e > 0 ? e : null;
      }
    }
    if (body.priceUsd !== undefined) {
      if (body.priceUsd === null || body.priceUsd === "") {
        pricePatch.priceUsd = null;
      } else {
        const u = Number(body.priceUsd);
        pricePatch.priceUsd = Number.isFinite(u) && u > 0 ? u : null;
      }
    }
    if (body.compareAtPriceNum !== undefined) {
      if (body.compareAtPriceNum === null || body.compareAtPriceNum === "") {
        pricePatch.compareAtPriceNum = null;
      } else {
        const c = Number(body.compareAtPriceNum);
        pricePatch.compareAtPriceNum =
          Number.isFinite(c) && c > 0 ? c : null;
      }
    }
    if (Object.keys(pricePatch).length) {
      next = applyPricePatch(next, pricePatch);
    }

    await upsertProduct(next);
    const fresh = await getProductById(id);
    return NextResponse.json(fresh ?? next);
  } catch (error) {
    console.error("[PATCH /api/admin/products/:id]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;
  const ok = await deleteProduct(id);
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
