/** Client-side: normalize picks (HEIC → JPEG) and cap size before crop / upload. */

import { looksLikeVideoBytes } from "@/lib/mediaBytes";
import { isImageUploadFile as isImageUploadMedia } from "@/lib/mediaUploadKind";

/** Long edge cap — enough for 960×1600 export, much faster in the crop editor. */
const MAX_EDITOR_EDGE = 2200;

export function isImageUploadFile(file: File): boolean {
  return isImageUploadMedia(file);
}

function isHeicFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    ext === "heic" ||
    ext === "heif"
  );
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("img"));
        el.src = url;
      });
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

/** Shrink huge phone photos so crop UI + canvas stay responsive. */
async function downscaleForEditor(file: File): Promise<File> {
  const bmp = await loadImageBitmap(file);
  try {
    const maxEdge = Math.max(bmp.width, bmp.height);
    if (maxEdge <= MAX_EDITOR_EDGE) return file;
    const scale = MAX_EDITOR_EDGE / maxEdge;
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88)
    );
    if (!blob) return file;
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    bmp.close();
  }
}

export async function prepareImageUploadFile(file: File): Promise<File> {
  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  if (looksLikeVideoBytes(head)) {
    throw new Error("video_file");
  }
  let next = file;
  if (isHeicFile(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.82,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    const base = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
    next = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  }
  return downscaleForEditor(next);
}
