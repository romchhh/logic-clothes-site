import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/categories";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;
  const category = await getCategoryById(decodeURIComponent(id));
  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(category);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const updated = await updateCategory(decodeURIComponent(id), {
      image: body.image != null ? String(body.image) : undefined,
      label: body.label
        ? { uk: String(body.label.uk ?? ""), en: String(body.label.en ?? "") }
        : undefined,
      cta: body.cta
        ? { uk: String(body.cta.uk ?? ""), en: String(body.cta.en ?? "") }
        : undefined,
      kind: body.kind === "collection" ? "collection" : undefined,
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      isVisible:
        typeof body.isVisible === "boolean" ? body.isVisible : undefined,
    });
    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await ctx.params;

  try {
    await deleteCategory(decodeURIComponent(id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message.includes("not found")
      ? 404
      : message.includes("System") || message.includes("products")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
