import { promises as fs } from "fs";
import { NextRequest, NextResponse } from "next/server";
import {
  contentTypeForMedia,
  resolveProductMediaPath,
} from "@/lib/productMediaStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ filename: string }> };

/**
 * Serve product uploads from disk. Needed because Next.js does not reliably
 * expose files written to /public after the process has started — they only
 * appear after a restart if served as static assets.
 */
export async function GET(_request: NextRequest, { params }: Params) {
  const { filename: raw } = await params;
  const filename = decodeURIComponent(raw || "");
  const filePath = resolveProductMediaPath(filename);
  if (!filePath) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentTypeForMedia(filename),
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
