import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import os from "os";
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
import {
  isVideoUpload,
  sanitizeVideoExtension,
} from "@/lib/mediaUploadKind";

export const runtime = "nodejs";

type CropPayload = {
  x: number; // 0–1 relative to source
  y: number;
  w: number;
  h: number;
};

function looksLikeVideo(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const head = buf.subarray(0, 16).toString("latin1");
  if (head.includes("ftyp")) return true;
  if (
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBM"
  ) {
    return true;
  }
  return false;
}

function runCmd(
  bin: string,
  args: string[],
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "ignore", "pipe"] });
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error(`${bin} timeout`));
    }, timeoutMs);
    child.on("error", (err) => finish(err));
    child.on("close", (code) => {
      if (code === 0) finish();
      else finish(new Error(`${bin} ${code}`));
    });
  });
}

/**
 * Store video immediately. mp4/webm are written as-is.
 * MOV and other containers get a short stream-copy remux (no re-encode).
 * If that does not finish quickly, the original file is saved so the request never hangs.
 */
async function storeVideoFile(
  input: Buffer,
  name: string,
  mime: string,
  dir: string,
  base: string
): Promise<string> {
  const ext = sanitizeVideoExtension(name);
  const mimeL = mime.toLowerCase();
  const directMp4 = ext === "mp4" || mimeL.includes("mp4");
  const directWebm = ext === "webm" || mimeL.includes("webm");

  if (directMp4 || directWebm) {
    const filename = `${base}.${directWebm ? "webm" : "mp4"}`;
    await fs.writeFile(path.join(dir, filename), input);
    return filename;
  }

  const tmpIn = path.join(os.tmpdir(), `lc-vid-${base}`);
  const tmpOut = path.join(os.tmpdir(), `lc-vid-${base}.mp4`);
  try {
    await fs.writeFile(tmpIn, input);
    await runCmd(
      "ffmpeg",
      ["-y", "-i", tmpIn, "-c", "copy", "-movflags", "+faststart", tmpOut],
      8000
    );
    const filename = `${base}.mp4`;
    await fs.copyFile(tmpOut, path.join(dir, filename));
    return filename;
  } catch (err) {
    console.warn("[upload] fast remux skipped:", err);
    const filename = `${base}.${ext}`;
    await fs.writeFile(path.join(dir, filename), input);
    return filename;
  } finally {
    await fs.unlink(tmpIn).catch(() => {});
    await fs.unlink(tmpOut).catch(() => {});
  }
}

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
      const isVideo =
        isVideoUpload(file.name, file.type) || looksLikeVideo(buf);

      if (isVideo) {
        const filename = await storeVideoFile(
          buf,
          file.name,
          file.type,
          dir,
          base
        );
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
