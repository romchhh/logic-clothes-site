/** Storefront product card frame — must match catalog + PDP + admin crop. */
export const PRODUCT_CARD_ASPECT = 3 / 5;
/** Same fill as `.product-img` / `.pdp-gallery-item` (`--white`). */
export const PRODUCT_CARD_FRAME_BG = "#ffffff";
/** Catalog / PDP export — keep high enough for retina without heavy artifacts. */
export const PRODUCT_CARD_EXPORT_W = 1200;
export const PRODUCT_CARD_EXPORT_H = 2000;

/**
 * Integer 3:5 box that fits inside a slot.
 * Width is a multiple of 3 and height of 5 so 1200×2000 export scales uniformly.
 */
export function fitProductCardFrame(
  slotW: number,
  slotH: number
): { w: number; h: number } {
  if (slotW < 3 || slotH < 5) return { w: 3, h: 5 };
  let w = Math.floor(Math.min(slotW, (slotH * 3) / 5));
  w = Math.max(3, w - (w % 3));
  let h = (w * 5) / 3;
  if (h > slotH + 0.01) {
    h = Math.floor(slotH);
    h = Math.max(5, h - (h % 5));
    w = (h * 3) / 5;
  }
  return { w, h };
}
