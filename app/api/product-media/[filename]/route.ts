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
    const stat = await fs.stat(filePath);
    const type = contentTypeForMedia(filename);
    const range = _request.headers.get("range");
    if (range) {
      const match = /bytes=(\d+)-(\d*)/.exec(range);
      const start = match ? Number(match[1]) : 0;
      const end = match && match[2] ? Number(match[2]) : stat.size - 1;
      const safeEnd = Math.min(end, stat.size - 1);
      const fh = await fs.open(filePath, "r");
      try {
        const len = safeEnd - start + 1;
        const buf = Buffer.alloc(len);
        await fh.read(buf, 0, len, start);
        return new NextResponse(buf, {
          status: 206,
          headers: {
            "Content-Type": type,
            "Content-Length": String(len),
            "Content-Range": `bytes ${start}-${safeEnd}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=86400",
          },
        });
      } finally {
        await fh.close();
      }
    }
    const buf = await fs.readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Length": String(buf.byteLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
