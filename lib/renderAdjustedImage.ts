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

/**
 * Same pixels as the editor frame: crop first, then the exact CSS filter
 * the preview uses (filter-after-scale, not filter-while-resampling).
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
  const bctx = base.getContext("2d", { alpha: false });
  if (!bctx) throw new Error("canvas");

  const sx = Math.max(0, Math.round(crop.x * sourceW));
  const sy = Math.max(0, Math.round(crop.y * sourceH));
  const sw = Math.max(1, Math.round(crop.w * sourceW));
  const sh = Math.max(1, Math.round(crop.h * sourceH));
  bctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);

  const filter = mediaAdjustCssFilter(adjust);
  if (!filter) return canvasToJpeg(base);

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const octx = out.getContext("2d", { alpha: false });
  if (!octx) return canvasToJpeg(base);
  octx.filter = filter;
  octx.drawImage(base, 0, 0);
  return canvasToJpeg(out);
}
