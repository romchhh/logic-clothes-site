import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/adminAuth";
import { decodeImageToJpegBuffer } from "@/lib/sharpDecodeImage";
import {
  PRODUCT_CARD_EXPORT_H,
  PRODUCT_CARD_EXPORT_W,
} from "@/lib/productCardImage";
import {
  productMediaDir,
  productMediaPublicUrl,
} from "@/lib/productMediaStorage";

export const runtime = "nodejs";

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
    const fitMode = String(form.get("fit") || "");
    const fitCard =
      fitMode === "catalog" ||
      fitMode === "instagram" ||
      Boolean(crop);
    const fitHero = fitMode === "hero";

    const dir = productMediaDir();
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
          url: productMediaPublicUrl(filename),
          type: "video",
        });
        continue;
      }

      let decoded: Buffer;
      try {
        decoded = await decodeImageToJpegBuffer(buf, base);
      } catch (decodeErr) {
        console.error("[upload] decode failed:", decodeErr);
        return NextResponse.json(
          {
            error: "unsupported_image",
            message:
              "Формат фото не підтримується. Спробуйте JPEG або PNG, або збережіть HEIC як JPEG у Фото.",
          },
          { status: 415 }
        );
      }

      const meta = await sharp(decoded).metadata();
      const srcW = meta.width || PRODUCT_CARD_EXPORT_W;
      const srcH = meta.height || PRODUCT_CARD_EXPORT_H;

      let pipeline;

      if (crop) {
        const left = Math.max(0, Math.round(crop.x * srcW));
        const top = Math.max(0, Math.round(crop.y * srcH));
        const width = Math.min(srcW - left, Math.round(crop.w * srcW));
        const height = Math.min(srcH - top, Math.round(crop.h * srcH));
        pipeline = sharp(decoded)
          .extract({
            left,
            top,
            width: Math.max(1, width),
            height: Math.max(1, height),
          })
          .resize(PRODUCT_CARD_EXPORT_W, PRODUCT_CARD_EXPORT_H, {
            fit: "fill",
          });
      } else if (fitCard) {
        pipeline = sharp(decoded).resize(
          PRODUCT_CARD_EXPORT_W,
          PRODUCT_CARD_EXPORT_H,
          {
            fit: "cover",
            position: "centre",
          }
        );
      } else if (fitHero) {
        pipeline = sharp(decoded).resize({
          width: 2400,
          withoutEnlargement: true,
        });
      } else {
        pipeline = sharp(decoded).resize({
          width: 1600,
          withoutEnlargement: true,
        });
      }

      const filename = `${base}.webp`;
      const outPath = path.join(dir, filename);
      const info = await pipeline.webp({ quality: 84 }).toFile(outPath);
      items.push({
        url: productMediaPublicUrl(filename),
        type: "image",
        width: info.width,
        height: info.height,
      });
    }

    // Avoid CDN/browser caching a 404 from before the file existed.
    const res = NextResponse.json({
      urls: items.map((i) => i.url),
      items,
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
