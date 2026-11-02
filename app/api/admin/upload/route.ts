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
import { looksLikeVideoBytes } from "@/lib/mediaBytes";
import {
  isVideoUpload,
  sanitizeVideoExtension,
} from "@/lib/mediaUploadKind";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    const readyFlag = String(form.get("ready") || "");
    const kindVideo =
      String(form.get("kind") || "") === "video" ||
      String(form.get("video") || "") === "1";
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
      const base = `${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const isVideo =
        kindVideo ||
        isVideoUpload(file.name, file.type) ||
        looksLikeVideoBytes(buf);

      if (isVideo) {
        const filename = `${base}.${sanitizeVideoExtension(file.name)}`;
        await fs.writeFile(path.join(dir, filename), buf);
        items.push({
          url: productMediaPublicUrl(filename),
          type: "video",
        });
        continue;
      }

      // Client already cropped/toned — write bytes, do not decode again.
      if ((readyFlag === "1" || readyFlag === "true") && !crop) {
        const jpeg =
          file.type === "image/jpeg" ||
          file.name.toLowerCase().endsWith(".jpg") ||
          file.name.toLowerCase().endsWith(".jpeg");
        const filename = `${base}.${jpeg ? "jpg" : "webp"}`;
        await fs.writeFile(path.join(dir, filename), buf);
        items.push({
          url: productMediaPublicUrl(filename),
          type: "image",
          width: PRODUCT_CARD_EXPORT_W,
          height: PRODUCT_CARD_EXPORT_H,
        });
        continue;
      }

      if (looksLikeVideoBytes(buf)) {
        const filename = `${base}.${sanitizeVideoExtension(file.name)}`;
        await fs.writeFile(path.join(dir, filename), buf);
        items.push({
          url: productMediaPublicUrl(filename),
          type: "video",
        });
        continue;
      }

      // Prefer single-pass sharp (no full-res JPEG intermediate).
      let working: Buffer = buf;
      let srcW = PRODUCT_CARD_EXPORT_W;
      let srcH = PRODUCT_CARD_EXPORT_H;
      try {
        const meta = await sharp(buf, { failOn: "none" }).rotate().metadata();
        srcW = meta.width || srcW;
        srcH = meta.height || srcH;
      } catch (directErr) {
        try {
          working = await decodeImageToJpegBuffer(buf, base);
          const meta = await sharp(working).metadata();
          srcW = meta.width || srcW;
          srcH = meta.height || srcH;
        } catch (decodeErr) {
          console.error("[upload] decode failed:", decodeErr || directErr);
          return NextResponse.json(
            {
              error: "unsupported_image",
              message:
                "Не вдалося обробити файл як зображення. Спробуйте JPEG/PNG або конвертуйте у MP4 для відео.",
            },
            { status: 415 }
          );
        }
      }

      let pipeline = sharp(working, { failOn: "none" }).rotate();

      if (crop) {
        const left = Math.max(0, Math.round(crop.x * srcW));
        const top = Math.max(0, Math.round(crop.y * srcH));
        const width = Math.min(srcW - left, Math.round(crop.w * srcW));
        const height = Math.min(srcH - top, Math.round(crop.h * srcH));
        pipeline = pipeline
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
        pipeline = pipeline.resize(
          PRODUCT_CARD_EXPORT_W,
          PRODUCT_CARD_EXPORT_H,
          {
            fit: "cover",
            position: "centre",
          }
        );
      } else if (fitHero) {
        pipeline = pipeline.resize({
          width: 2000,
          withoutEnlargement: true,
        });
      } else {
        pipeline = pipeline.resize({
          width: 1400,
          withoutEnlargement: true,
        });
      }

      const filename = `${base}.webp`;
      const outPath = path.join(dir, filename);
      const info = await pipeline
        .webp({ quality: 78, effort: 3 })
        .toFile(outPath);
      items.push({
        url: productMediaPublicUrl(filename),
        type: "image",
        width: info.width,
        height: info.height,
      });
    }

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
