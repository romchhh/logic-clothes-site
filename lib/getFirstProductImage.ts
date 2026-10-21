/** Logic Clothes products store image paths directly on `images[]`. */
export function getProductImageSrc(
  images: string[] | string | null | undefined,
  fallback = "/assets/logo-header.png"
): string {
  if (!images) return fallback;
  if (typeof images === "string") return images || fallback;
  return images[0] || fallback;
}
