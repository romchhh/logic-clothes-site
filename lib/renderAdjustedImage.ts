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
      0.94
    );
  });
}

/**
 * Fallback tone when canvas.filter is unavailable.
 * Tuned to approximate mediaAdjustCssFilter (preview), not a stronger look.
 */
function applyTonePixels(data: ImageData, adjust: MediaAdjust): void {
  const br = 1 + adjust.brightness / 100;
  const ct =
    (1 + adjust.contrast / 100) *
    (adjust.sharpness > 0 ? 1 + adjust.sharpness / 280 : 1);
  const sat = 1 + adjust.saturation / 100;
  const warm = adjust.warmth / 100;
  const px = data.data;

  for (let i = 0; i < px.length; i += 4) {
    let r = px[i] * br;
    let g = px[i + 1] * br;
    let b = px[i + 2] * br;

    r = (r - 128) * ct + 128;
    g = (g - 128) * ct + 128;
    b = (b - 128) * ct + 128;

    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * sat;
    g = gray + (g - gray) * sat;
    b = gray + (b - gray) * sat;

    // Approximate CSS sepia + hue-rotate warmth (milder than old RGB shove).
    if (warm !== 0) {
      if (warm > 0) {
        const s = warm * 0.35;
        const sr = r * (1 - s) + (r * 0.393 + g * 0.769 + b * 0.189) * s;
        const sg = g * (1 - s) + (r * 0.349 + g * 0.686 + b * 0.168) * s;
        const sb = b * (1 - s) + (r * 0.272 + g * 0.534 + b * 0.131) * s;
        r = sr;
        g = sg;
        b = sb;
        // slight yellow shift
        r += warm * 6;
        b -= warm * 8;
      } else {
        r += warm * 10;
        b -= warm * 14;
        g += warm * 4;
      }
    }

    px[i] = Math.min(255, Math.max(0, Math.round(r)));
    px[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
    px[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
  }
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
  const rot = adjust.rotate ?? 0;
  bctx.fillStyle = "#111";
  bctx.fillRect(0, 0, outW, outH);
  if (Math.abs(rot) > 0.05) {
    bctx.save();
    bctx.translate(outW / 2, outH / 2);
    bctx.rotate((rot * Math.PI) / 180);
    // Slight overscan so rotation does not leave empty corners in frame.
    const over = 1.12;
    bctx.drawImage(
      source,
      sx,
      sy,
      sw,
      sh,
      (-outW * over) / 2,
      (-outH * over) / 2,
      outW * over,
      outH * over
    );
    bctx.restore();
  } else {
    bctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  }

  const needsColorTone =
    adjust.brightness !== 0 ||
    adjust.contrast !== 0 ||
    adjust.warmth !== 0 ||
    adjust.saturation !== 0 ||
    adjust.sharpness !== 0;
  if (!needsColorTone) return canvasToJpeg(base);

  // Same CSS filter string as the live editor preview — no extra pixel
  // sharpness on top (that was making Apply look much stronger).
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
        octx.filter = "none";
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
