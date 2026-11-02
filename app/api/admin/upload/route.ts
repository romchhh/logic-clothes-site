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

const BROWSER_VIDEO_CODECS = new Set([
  "h264",
  "avc1",
  "avc",
  "vp8",
  "vp9",
  "av1",
  "theora",
]);

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

function likelyNeedsTranscode(name: string, mime: string): boolean {
  const lower = name.toLowerCase();
  const m = mime.toLowerCase();
  if (
    m.includes("quicktime") ||
    m.includes("hevc") ||
    m.includes("x-m4v") ||
    lower.endsWith(".mov") ||
    lower.endsWith(".qt") ||
    lower.endsWith(".m4v") ||
    lower.endsWith(".hevc") ||
    lower.endsWith(".mkv") ||
    lower.endsWith(".avi") ||
    lower.endsWith(".3gp")
  ) {
    return true;
  }
  // mp4 / webm often already browser-ready — confirm with ffprobe when available
  return false;
}

function runCmd(
  bin: string,
  args: string[],
  timeoutMs: number
): Promise<{ code: number; stdout: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${bin} timeout`));
    }, timeoutMs);
    child.stdout.on("data", (d: Buffer) => {
      stdout += d.toString("utf8");
    });
    child.stderr.on("data", (d: Buffer) => {
      stderr += d.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ code: 0, stdout });
      else reject(new Error(`${bin} ${code}: ${stderr.slice(-400)}`));
    });
  });
}

async function probeVideoCodec(filePath: string): Promise<string | null> {
  try {
    const { stdout } = await runCmd(
      "ffprobe",
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name",
        "-of",
        "csv=p=0",
        filePath,
      ],
      8000
    );
    return stdout.trim().toLowerCase().split(/[\r\n,]/)[0] || null;
  } catch {
    return null;
  }
}

/** Fast path: keep file if already browser-playable; else re-encode lightly. */
async function ensureBrowserVideo(
  input: Buffer,
  name: string,
  mime: string
): Promise<{ data: Uint8Array; ext: string }> {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const tmpIn = path.join(os.tmpdir(), `lc-vid-${id}`);
  await fs.writeFile(tmpIn, input);

  try {
    const codec = await probeVideoCodec(tmpIn);
    const force = likelyNeedsTranscode(name, mime);
    const okCodec = codec ? BROWSER_VIDEO_CODECS.has(codec) : false;
    const looksMp4 =
      name.toLowerCase().endsWith(".mp4") ||
      mime.toLowerCase().includes("mp4");
    const looksWebm =
      name.toLowerCase().endsWith(".webm") ||
      mime.toLowerCase().includes("webm");

    // Already friendly — store as-is (no re-encode).
    if (!force && okCodec && (looksMp4 || looksWebm)) {
      return {
        data: input,
        ext: looksWebm ? "webm" : "mp4",
      };
    }
    if (!force && !codec && looksMp4) {
      // No ffprobe — trust mp4 from desktop cameras; skip slow encode.
      return { data: input, ext: "mp4" };
    }
    if (!force && looksWebm) {
      return { data: input, ext: "webm" };
    }

    const tmpOut = path.join(os.tmpdir(), `lc-vid-${id}.mp4`);
    try {
      // ultrafast + higher CRF + no audio: product clips don't need soundtrack
      await runCmd(
        "ffmpeg",
        [
          "-y",
          "-i",
          tmpIn,
          "-an",
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "28",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          "-vf",
          "scale='min(960,iw)':-2",
          "-threads",
          "0",
          tmpOut,
        ],
        120_000
      );
      return {
        data: new Uint8Array(await fs.readFile(tmpOut)),
        ext: "mp4",
      };
    } finally {
      await fs.unlink(tmpOut).catch(() => {});
    }
  } finally {
    await fs.unlink(tmpIn).catch(() => {});
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

function isClientReadyWebp(file: File, readyFlag: string): boolean {
  if (readyFlag === "1" || readyFlag === "true") return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    (type === "image/webp" || name.endsWith(".webp")) &&
    (name.includes("catalog") || name.includes("crop"))
  );
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
        let videoBuf: Uint8Array = buf;
        let ext = "mp4";
        try {
          const ensured = await ensureBrowserVideo(buf, file.name, file.type);
          videoBuf = ensured.data;
          ext = ensured.ext;
        } catch (err) {
          console.error("[upload] video optimize failed, storing original:", err);
          ext = sanitizeVideoExtension(file.name);
        }
        const filename = `${base}.${ext}`;
        await fs.writeFile(path.join(dir, filename), videoBuf);
        items.push({
          url: productMediaPublicUrl(filename),
          type: "video",
        });
        continue;
      }

      // Client already cropped/toned to catalog webp — skip second encode.
      if (isClientReadyWebp(file, readyFlag) && !crop) {
        const filename = `${base}.webp`;
        await fs.writeFile(path.join(dir, filename), buf);
        let width = PRODUCT_CARD_EXPORT_W;
        let height = PRODUCT_CARD_EXPORT_H;
        try {
          const meta = await sharp(buf).metadata();
          if (meta.width) width = meta.width;
          if (meta.height) height = meta.height;
        } catch {
          /* keep defaults */
        }
        items.push({
          url: productMediaPublicUrl(filename),
          type: "image",
          width,
          height,
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
