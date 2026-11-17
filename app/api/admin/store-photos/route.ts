import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  getStorePhotosFresh,
  parseStorePhotos,
  saveStorePhotos,
} from "@/lib/storePhotos";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const photos = await getStorePhotosFresh();
    return NextResponse.json({ photos });
  } catch (error) {
    console.error("[GET /api/admin/store-photos]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { photos?: unknown };
    const photos = parseStorePhotos(body.photos);
    const saved = await saveStorePhotos(photos);
    return NextResponse.json({ photos: saved });
  } catch (error) {
    console.error("[PUT /api/admin/store-photos]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
