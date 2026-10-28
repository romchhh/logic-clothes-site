import { normalizeMediaAdjust } from "@/lib/mediaAdjust";
import { formatPriceLabel } from "@/lib/sql";
import type { Product, ProductMedia } from "@/lib/types";

function numOrNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function cleanAssetUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      return `${u.pathname}`;
    }
  } catch {
    /* keep as-is */
  }
  return trimmed.split("?")[0].split("#")[0];
}

function parseMedia(body: Record<string, unknown>, images: string[]): ProductMedia[] {
  if (Array.isArray(body.media)) {
    return body.media
      .map((m) => {
        if (!m || typeof m !== "object") return null;
        const row = m as Record<string, unknown>;
        const url = cleanAssetUrl(String(row.url || ""));
        if (!url) return null;
        return {
          url,
          type: row.type === "video" ? ("video" as const) : ("image" as const),
          ...(typeof row.width === "number" ? { width: row.width } : {}),
          ...(typeof row.height === "number" ? { height: row.height } : {}),
          ...(normalizeMediaAdjust(row.adjust)
            ? { adjust: normalizeMediaAdjust(row.adjust) }
            : {}),
        };
      })
      .filter((m): m is ProductMedia => Boolean(m));
  }
  return images
    .map((url) => cleanAssetUrl(url))
    .filter(Boolean)
    .map((url) => ({ url, type: "image" as const }));
}

/** Merge request body into a Product for create/update. */
export function productFromBody(
  body: Record<string, unknown>,
  base: Partial<Product> & { id: string }
): Product {
  const sizeOptions: string[] = Array.isArray(body.sizeOptions)
    ? body.sizeOptions.map(String).filter(Boolean)
    : base.sizeOptions || ["S", "M", "L"];
  const lengthOptions: string[] = Array.isArray(body.lengthOptions)
    ? body.lengthOptions.map(String).filter(Boolean)
    : base.lengthOptions || [];
  const materialOptions: string[] = Array.isArray(body.materialOptions)
    ? body.materialOptions.map(String).filter(Boolean)
    : base.materialOptions || [];
  const priceNum =
    numOrNull(body.priceNum) ?? base.priceNum ?? 0;
  const images: string[] = Array.isArray(body.images)
    ? body.images.map((u) => cleanAssetUrl(String(u))).filter(Boolean)
    : base.images || [];
  const media = parseMedia(body, images);
  const imageUrls =
    media.filter((m) => m.type === "image").map((m) => m.url) || images;

  const lookProductIds = Array.isArray(body.lookProductIds)
    ? body.lookProductIds.map(String).filter(Boolean)
    : base.lookProductIds;

  const priceEur = numOrNull(body.priceEur);
  const priceUsd =
    body.priceUsd !== undefined ? numOrNull(body.priceUsd) : undefined;
  const compareAtPriceNum = numOrNull(body.compareAtPriceNum);

  return {
    id: base.id,
    name:
      body.name != null ? String(body.name).trim() : base.name || "",
    nameEn:
      body.nameEn != null
        ? String(body.nameEn)
        : base.nameEn || "",
    sizes: sizeOptions.join(" · "),
    sizeOptions,
    lengthOptions,
    materialOptions,
    priceNum,
    price: formatPriceLabel(priceNum),
    priceEur: priceEur != null && priceEur > 0 ? priceEur : null,
    priceUsd:
      priceUsd !== undefined
        ? priceUsd != null && priceUsd > 0
          ? priceUsd
          : null
        : base.priceUsd ?? null,
    compareAtPriceNum:
      compareAtPriceNum != null && compareAtPriceNum > 0
        ? compareAtPriceNum
        : null,
    color: body.color != null ? String(body.color) : base.color || "",
    colorHex:
      body.colorHex != null ? String(body.colorHex) : base.colorHex || "",
    material:
      body.material != null ? String(body.material) : base.material || "",
    description:
      body.description != null
        ? String(body.description)
        : base.description || "",
    descriptionEn:
      body.descriptionEn != null
        ? String(body.descriptionEn)
        : base.descriptionEn || "",
    longDescription:
      body.longDescription != null
        ? String(body.longDescription)
        : base.longDescription || "",
    longDescriptionEn:
      body.longDescriptionEn != null
        ? String(body.longDescriptionEn)
        : base.longDescriptionEn || "",
    shortDescription:
      body.shortDescription === null
        ? undefined
        : body.shortDescription != null
          ? String(body.shortDescription)
          : base.shortDescription,
    photoSize:
      body.photoSize != null ? String(body.photoSize) : base.photoSize || "",
    modelParams:
      body.modelParams != null
        ? String(body.modelParams)
        : base.modelParams || "",
    images: imageUrls,
    media,
    swatches: Array.isArray(body.swatches)
      ? body.swatches
      : base.swatches || [],
    inStock:
      body.inStock != null ? Boolean(body.inStock) : base.inStock !== false,
    isVisible:
      body.isVisible != null
        ? Boolean(body.isVisible)
        : base.isVisible !== false,
    sku:
      body.sku != null
        ? (body.sku as string | number)
        : (base.sku ?? base.id),
    category:
      body.category != null
        ? String(body.category).trim() || undefined
        : base.category,
    isNew: body.isNew != null ? Boolean(body.isNew) : Boolean(base.isNew),
    isPopular:
      body.isPopular != null
        ? Boolean(body.isPopular)
        : Boolean(base.isPopular),
    isSale:
      body.isSale != null ? Boolean(body.isSale) : Boolean(base.isSale),
    sortOrder:
      body.sortOrder != null && body.sortOrder !== ""
        ? Number(body.sortOrder)
        : base.sortOrder,
    lookProductIds,
    colorGroup: base.colorGroup ?? null,
  };
}
