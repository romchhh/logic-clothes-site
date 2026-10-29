/** Shared image/video detection for admin uploads (client + server). */

export const VIDEO_EXTENSIONS = new Set([
  "mp4",
  "m4v",
  "mov",
  "qt",
  "webm",
  "ogv",
  "ogg",
  "avi",
  "mkv",
  "3gp",
  "3g2",
  "wmv",
  "flv",
  "mpeg",
  "mpg",
  "mpe",
  "mpv",
  "m2v",
  "hevc",
  "h264",
  "asf",
  "vob",
  "ts",
  "mts",
  "m2ts",
  "f4v",
  "divx",
]);

export const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "jpe",
  "jfif",
  "pjpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "heif",
  "bmp",
  "dib",
  "tiff",
  "tif",
  "svg",
  "svgz",
  "ico",
  "apng",
  "raw",
  "cr2",
  "nef",
  "arw",
  "dng",
  "orf",
  "rw2",
]);

function extFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
}

export function isVideoUpload(name: string, mimeType = ""): boolean {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("video/")) return true;
  if (mime === "application/octet-stream") {
    const ext = extFromName(name);
    if (ext && VIDEO_EXTENSIONS.has(ext)) return true;
  }
  const ext = extFromName(name);
  return ext ? VIDEO_EXTENSIONS.has(ext) : false;
}

export function isImageUpload(name: string, mimeType = ""): boolean {
  if (isVideoUpload(name, mimeType)) return false;
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/")) return true;
  const ext = extFromName(name);
  if (ext && IMAGE_EXTENSIONS.has(ext)) return true;
  /** Phones often send empty MIME — treat unknown as image and let sharp try. */
  if (!mime || mime === "application/octet-stream") return true;
  return false;
}

export function isVideoUploadFile(file: File): boolean {
  return isVideoUpload(file.name, file.type);
}

export function isImageUploadFile(file: File): boolean {
  return isImageUpload(file.name, file.type);
}

/** Safe extension for stored video files. */
export function sanitizeVideoExtension(name: string): string {
  const ext = extFromName(name);
  if (ext && VIDEO_EXTENSIONS.has(ext)) return ext;
  return "mp4";
}
