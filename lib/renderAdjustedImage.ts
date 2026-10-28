import {
  DEFAULT_MEDIA_ADJUST,
  mediaAdjustCssFilter,
  type MediaAdjust,
} from "@/lib/mediaAdjust";
import {
  PRODUCT_CARD_EXPORT_H,
  PRODUCT_CARD_EXPORT_W,
} from "@/lib/productCardImage";

export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function applyWarmthPixels(data: ImageData, warmth: number) {
  if (!warmth) return;
  const d = data.data;
  const k = warmth * 1.4;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = Math.min(255, Math.max(0, d[i] + k));
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] - k * 0.85));
  }
}

function applySharpen(data: ImageData, amount: number) {
  if (amount <= 0) return;
  const w = data.width;
  const h = data.height;
  const src = new Uint8ClampedArray(data.data);
  const out = data.data;
  const strength = (amount / 100) * 0.6;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let ki = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * w + (x + kx)) * 4 + c;
            sum += src[idx] * kernel[ki];
            ki++;
          }
        }
        const idx = (y * w + x) * 4 + c;
        const blended = src[idx] * (1 - strength) + sum * strength;
        out[idx] = Math.min(255, Math.max(0, blended));
      }
    }
  }
}

/**
 * Crop (normalized 0–1), tone, export to catalog 3:5 webp blob.
 */
export async function renderAdjustedImageBlob(
  source: CanvasImageSource & { width?: number; height?: number },
  sourceW: number,
  sourceH: number,
  crop: CropRect,
  adjust: MediaAdjust = DEFAULT_MEDIA_ADJUST,
  outW = PRODUCT_CARD_EXPORT_W,
  outH = PRODUCT_CARD_EXPORT_H
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const sx = Math.max(0, Math.round(crop.x * sourceW));
  const sy = Math.max(0, Math.round(crop.y * sourceH));
  const sw = Math.max(1, Math.round(crop.w * sourceW));
  const sh = Math.max(1, Math.round(crop.h * sourceH));

  const filter = mediaAdjustCssFilter(adjust);
  if (filter) ctx.filter = filter;

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  ctx.filter = "none";

  if (adjust.warmth !== 0 || adjust.sharpness > 0) {
    const imageData = ctx.getImageData(0, 0, outW, outH);
    if (adjust.warmth !== 0) applyWarmthPixels(imageData, adjust.warmth);
    if (adjust.sharpness > 0) applySharpen(imageData, adjust.sharpness);
    ctx.putImageData(imageData, 0, 0);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
      "image/webp",
      0.88
    );
  });
}
