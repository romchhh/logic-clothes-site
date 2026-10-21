import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { duplicateProduct } from "@/lib/adminStore";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const { id } = await params;

  try {
    const copy = await duplicateProduct(decodeURIComponent(id));
    if (!copy) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(copy, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/products/:id/duplicate]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
