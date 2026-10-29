import path from "node:path";

/** On-disk directory for product photos/videos (runtime uploads + catalog assets). */
export function productMediaDir(): string {
  return path.join(process.cwd(), "public", "assets", "products");
}

/** Safe absolute path for a product media filename, or null if invalid. */
export function resolveProductMediaPath(filename: string): string | null {
  const base = path.basename(filename);
  if (!base || base !== filename || base.includes("..")) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(base)) return null;
  return path.join(productMediaDir(), base);
}

export function productMediaPublicUrl(filename: string): string {
  return `/assets/products/${path.basename(filename)}`;
}

export function contentTypeForMedia(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
    case ".qt":
      return "video/quicktime";
    case ".m4v":
      return "video/x-m4v";
    case ".avi":
      return "video/x-msvideo";
    case ".mkv":
      return "video/x-matroska";
    case ".3gp":
    case ".3g2":
      return "video/3gpp";
    case ".ogv":
    case ".ogg":
      return "video/ogg";
    case ".heic":
    case ".heif":
      return "image/heic";
    case ".avif":
      return "image/avif";
    case ".tif":
    case ".tiff":
      return "image/tiff";
    case ".bmp":
      return "image/bmp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
