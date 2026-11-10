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

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob"))),
      "image/jpeg",
      0.92
    );
  });
}

/** Apply tone in pixel space — works even when canvas.filter is ignored (Safari). */
function applyTonePixels(
  data: ImageData,
  adjust: MediaAdjust
): void {
  const br = 1 + adjust.brightness / 100;
  const ct = 1 + adjust.contrast / 100;
  const sat = 1 + adjust.saturation / 100;
  const warm = adjust.warmth / 100;
  const sharp = adjust.sharpness / 100;
  const px = data.data;
  const w = data.width;
  const h = data.height;

  // Optional light unsharp-mask for sharpness > 0
  let blurCopy: Uint8ClampedArray | null = null;
  if (sharp > 0.01) {
    blurCopy = new Uint8ClampedArray(px);
    // 3x3 box blur into blurCopy (RGB only)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              sum += px[((y + dy) * w + (x + dx)) * 4 + c];
            }
          }
          blurCopy[i + c] = sum / 9;
        }
      }
    }
  }

  for (let i = 0; i < px.length; i += 4) {
    let r = px[i];
    let g = px[i + 1];
    let b = px[i + 2];

    if (blurCopy) {
      const amt = sharp * 0.55;
      r = r + (r - blurCopy[i]) * amt;
      g = g + (g - blurCopy[i + 1]) * amt;
      b = b + (b - blurCopy[i + 2]) * amt;
    }

    // brightness
    r *= br;
    g *= br;
    b *= br;

    // contrast around mid-gray
    r = (r - 128) * ct + 128;
    g = (g - 128) * ct + 128;
    b = (b - 128) * ct + 128;

    // saturation
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;

    // warmth: warm = more R/less B, cool = opposite
    if (warm !== 0) {
      r += warm * 28;
      b -= warm * 28;
      if (warm > 0) g += warm * 8;
      else g += warm * 4;
    }

    px[i] = Math.min(255, Math.max(0, Math.round(r)));
    px[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    px[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }
}

function hasTone(adjust: MediaAdjust): boolean {
  return !(
    adjust.brightness === 0 &&
    adjust.contrast === 0 &&
    adjust.warmth === 0 &&
    adjust.saturation === 0 &&
    adjust.sharpness === 0
  );
}

/**
 * Same pixels as the editor frame: crop first, then tone.
 * Uses pixel math so bake matches preview even without canvas.filter support.
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
  const base = document.createElement("canvas");
  base.width = outW;
  base.height = outH;
  const bctx = base.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!bctx) throw new Error("canvas");

  const sx = Math.max(0, Math.round(crop.x * sourceW));
  const sy = Math.max(0, Math.round(crop.y * sourceH));
  const sw = Math.max(1, Math.round(crop.w * sourceW));
  const sh = Math.max(1, Math.round(crop.h * sourceH));
  bctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);

  if (!hasTone(adjust)) return canvasToJpeg(base);

  // Prefer CSS filter path when supported (matches live preview filter string).
  const filter = mediaAdjustCssFilter(adjust);
  const supportsCanvasFilter =
    typeof (bctx as CanvasRenderingContext2D).filter === "string";

  if (filter && supportsCanvasFilter) {
    try {
      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const octx = out.getContext("2d", { alpha: false });
      if (octx) {
        octx.filter = filter;
        octx.drawImage(base, 0, 0);
        // Also bake sharpness in pixels if needed (not in CSS filter).
        if (adjust.sharpness > 0) {
          const img = octx.getImageData(0, 0, outW, outH);
          applyTonePixels(img, {
            ...DEFAULT_MEDIA_ADJUST,
            sharpness: adjust.sharpness,
          });
          octx.putImageData(img, 0, 0);
        }
        return canvasToJpeg(out);
      }
    } catch {
      /* fall through to pixel path */
    }
  }

  const img = bctx.getImageData(0, 0, outW, outH);
  applyTonePixels(img, adjust);
  bctx.putImageData(img, 0, 0);
  return canvasToJpeg(base);
}
