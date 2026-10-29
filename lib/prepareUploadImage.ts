/** Client-side: normalize picks (HEIC → JPEG) before crop / upload. */

import { isImageUploadFile as isImageUploadMedia } from "@/lib/mediaUploadKind";

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

export async function prepareImageUploadFile(file: File): Promise<File> {
  if (!isHeicFile(file)) return file;
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const base = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
