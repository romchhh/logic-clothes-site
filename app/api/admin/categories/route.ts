import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  createCategory,
  getAdminCategories,
  reorderCategories,
} from "@/lib/categories";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const categories = await getAdminCategories();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === "reorder") {
      const ids = body?.ids;
      if (!Array.isArray(ids) || !ids.every((x: unknown) => typeof x === "string")) {
        return NextResponse.json({ error: "ids required" }, { status: 400 });
      }
      await reorderCategories(ids);
      return NextResponse.json({ ok: true });
    }

    if (!body?.label?.uk || !body?.label?.en) {
      return NextResponse.json(
        { error: "label.uk and label.en required" },
        { status: 400 }
      );
    }

    const created = await createCategory({
      id: body.id ? String(body.id) : undefined,
      image: body.image ? String(body.image) : "",
      label: { uk: String(body.label.uk), en: String(body.label.en) },
      cta: body.cta
        ? { uk: String(body.cta.uk || ""), en: String(body.cta.en || "") }
        : undefined,
      kind: body.kind === "collection" ? "collection" : "category",
      sortOrder:
        typeof body.sortOrder === "number" ? body.sortOrder : undefined,
      isVisible: body.isVisible !== false,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create failed";
    const status =
      message.includes("already exists") || message.includes("Reserved")
        ? 409
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
