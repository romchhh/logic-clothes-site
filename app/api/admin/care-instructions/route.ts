import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { parseCareCatalog } from "@/lib/careInstructions";
import {
  getCareCatalogFresh,
  saveCareCatalog,
} from "@/lib/careCatalog";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const items = await getCareCatalogFresh();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[GET /api/admin/care-instructions]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { items?: unknown };
    const items = parseCareCatalog(body.items);
    const saved = await saveCareCatalog(items);
    return NextResponse.json({ items: saved });
  } catch (error) {
    console.error("[PUT /api/admin/care-instructions]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
