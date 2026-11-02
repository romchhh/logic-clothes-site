import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  getSitePagesStore,
  saveSitePagesStore,
  type SitePagesStore,
} from "@/lib/sitePages";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const pages = await getSitePagesStore();
    return NextResponse.json(pages);
  } catch (error) {
    console.error("[GET /api/admin/content]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as SitePagesStore;
    const saved = await saveSitePagesStore(body);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[PUT /api/admin/content]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
