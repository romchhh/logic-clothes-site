/** Quick photo / video tone — stored per media item, baked into images on export. */

export type MediaAdjust = {
  /** -100 … 100 */
  brightness: number;
  contrast: number;
  /** Negative = cooler, positive = warmer */
  warmth: number;
  saturation: number;
  /** 0 … 100 */
  sharpness: number;
};

export const DEFAULT_MEDIA_ADJUST: MediaAdjust = {
  brightness: 0,
  contrast: 0,
  warmth: 0,
  saturation: 0,
  sharpness: 0,
};

export function normalizeMediaAdjust(raw: unknown): MediaAdjust | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const clamp = (v: unknown, min: number, max: number, fallback: number) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };
  const a: MediaAdjust = {
    brightness: clamp(o.brightness, -100, 100, 0),
    contrast: clamp(o.contrast, -100, 100, 0),
    warmth: clamp(o.warmth, -100, 100, 0),
    saturation: clamp(o.saturation, -100, 100, 0),
    sharpness: clamp(o.sharpness, 0, 100, 0),
  };
  if (
    a.brightness === 0 &&
    a.contrast === 0 &&
    a.warmth === 0 &&
    a.saturation === 0 &&
    a.sharpness === 0
  ) {
    return undefined;
  }
  return a;
}

export function isDefaultAdjust(a: MediaAdjust | undefined): boolean {
  if (!a) return true;
  return (
    a.brightness === 0 &&
    a.contrast === 0 &&
    a.warmth === 0 &&
    a.saturation === 0 &&
    a.sharpness === 0
  );
}

/** CSS filter for live preview (images & video). */
export function mediaAdjustCssFilter(adjust: MediaAdjust | undefined): string | undefined {
  if (!adjust || isDefaultAdjust(adjust)) return undefined;
  const br = 1 + adjust.brightness / 100;
  const ct = 1 + adjust.contrast / 100;
  const sat = 1 + adjust.saturation / 100;
  const warm = adjust.warmth;
  const sepia = warm > 0 ? (warm / 100) * 0.35 : 0;
  const hue = warm * 0.25;
  const parts = [
    `brightness(${br.toFixed(3)})`,
    `contrast(${ct.toFixed(3)})`,
    `saturate(${sat.toFixed(3)})`,
  ];
  if (sepia > 0.01) parts.push(`sepia(${sepia.toFixed(3)})`);
  if (Math.abs(hue) > 0.5) parts.push(`hue-rotate(${hue.toFixed(1)}deg)`);
  if (warm < 0) {
    parts.push(`hue-rotate(${(warm * 0.15).toFixed(1)}deg)`);
  }
  return parts.join(" ");
}

export function mediaAdjustStyle(
  adjust: MediaAdjust | undefined
): { filter?: string } | undefined {
  const filter = mediaAdjustCssFilter(adjust);
  return filter ? { filter } : undefined;
}
