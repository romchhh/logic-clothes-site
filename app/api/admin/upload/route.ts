import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

/** Instagram portrait post ratio 4:5 */
const IG_W = 1080;
const IG_H = 1350;

type CropPayload = {
  x: number; // 0–1 relative to source
  y: number;
  w: number;
  h: number;
};

function parseCrop(raw: FormDataEntryValue | null): CropPayload | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    const c = JSON.parse(raw) as CropPayload;
    if (
      typeof c.x === "number" &&
      typeof c.y === "number" &&
      typeof c.w === "number" &&
      typeof c.h === "number" &&
      c.w > 0 &&
      c.h > 0
    ) {
      return c;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const form = await request.formData();
    const files = form
      .getAll("images")
      .filter((f): f is File => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ error: "no_files" }, { status: 400 });
    }

    const crop = parseCrop(form.get("crop"));
    const fitIg = form.get("fit") === "instagram" || Boolean(crop);

    const dir = path.join(process.cwd(), "public", "assets", "products");
    await fs.mkdir(dir, { recursive: true });

    const items: Array<{
      url: string;
      type: "image" | "video";
      width?: number;
      height?: number;
    }> = [];

    for (const file of files) {
      const buf = Buffer.from(await file.arrayBuffer());
      const base = `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const isVideo = file.type.startsWith("video/");

      if (isVideo) {
        const ext =
          file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          "mp4";
        const filename = `${base}.${ext}`;
        await fs.writeFile(path.join(dir, filename), buf);
        items.push({
          url: `/assets/products/${filename}`,
          type: "video",
        });
        continue;
      }

      let pipeline = sharp(buf).rotate();
      const meta = await pipeline.metadata();
      const srcW = meta.width || IG_W;
      const srcH = meta.height || IG_H;

      if (crop) {
        const left = Math.max(0, Math.round(crop.x * srcW));
        const top = Math.max(0, Math.round(crop.y * srcH));
        const width = Math.min(srcW - left, Math.round(crop.w * srcW));
        const height = Math.min(srcH - top, Math.round(crop.h * srcH));
        pipeline = sharp(buf)
          .rotate()
          .extract({ left, top, width: Math.max(1, width), height: Math.max(1, height) })
          .resize(IG_W, IG_H, { fit: "fill" });
      } else if (fitIg) {
        pipeline = sharp(buf)
          .rotate()
          .resize(IG_W, IG_H, { fit: "cover", position: "centre" });
      } else {
        pipeline = sharp(buf)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true });
      }

      const filename = `${base}.webp`;
      const outPath = path.join(dir, filename);
      const info = await pipeline.webp({ quality: 84 }).toFile(outPath);
      items.push({
        url: `/assets/products/${filename}`,
        type: "image",
        width: info.width,
        height: info.height,
      });
    }

    return NextResponse.json({
      urls: items.map((i) => i.url),
      items,
    });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
