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
    default:
      return "application/octet-stream";
  }
}
