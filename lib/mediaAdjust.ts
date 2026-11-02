/** Quick photo / video tone — stored per media item, baked into images on export. */

/** Video crop inside the 3:5 frame. x/y are object-position percents, zoom ≥ 1. */
export type MediaFrame = {
  x: number;
  y: number;
  zoom: number;
};

export type MediaAdjust = {
  /** -100 … 100 */
  brightness: number;
  contrast: number;
  /** Negative = cooler, positive = warmer */
  warmth: number;
  saturation: number;
  /** 0 … 100 */
  sharpness: number;
  frame?: MediaFrame;
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
  const frame = parseMediaFrame(o.frame);
  const a: MediaAdjust = {
    brightness: clamp(o.brightness, -100, 100, 0),
    contrast: clamp(o.contrast, -100, 100, 0),
    warmth: clamp(o.warmth, -100, 100, 0),
    saturation: clamp(o.saturation, -100, 100, 0),
    sharpness: clamp(o.sharpness, 0, 100, 0),
    ...(frame ? { frame } : {}),
  };
  if (isDefaultAdjust(a)) return undefined;
  return a;
}

function parseMediaFrame(raw: unknown): MediaFrame | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const n = (v: unknown, fallback: number) => {
    const x = typeof v === "number" ? v : Number(v);
    return Number.isFinite(x) ? x : fallback;
  };
  const frame: MediaFrame = {
    x: Math.min(100, Math.max(0, n(o.x, 50))),
    y: Math.min(100, Math.max(0, n(o.y, 50))),
    zoom: Math.min(4, Math.max(1, n(o.zoom, 1))),
  };
  if (frame.x === 50 && frame.y === 50 && frame.zoom <= 1.001) return undefined;
  return frame;
}

export function isDefaultAdjust(a: MediaAdjust | undefined): boolean {
  if (!a) return true;
  const tone =
    a.brightness === 0 &&
    a.contrast === 0 &&
    a.warmth === 0 &&
    a.saturation === 0 &&
    a.sharpness === 0;
  const frame = a.frame;
  const frameDefault =
    !frame || (frame.x === 50 && frame.y === 50 && frame.zoom <= 1.001);
  return tone && frameDefault;
}

export function mediaFrameStyle(
  frame: MediaFrame | undefined
): { objectFit: "cover"; objectPosition: string; transform?: string; transformOrigin?: string } {
  const x = frame?.x ?? 50;
  const y = frame?.y ?? 50;
  const zoom = frame?.zoom ?? 1;
  return {
    objectFit: "cover",
    objectPosition: `${x}% ${y}%`,
    ...(zoom > 1.001
      ? { transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }
      : {}),
  };
}

/** CSS filter for live preview (images & video). */
export function mediaAdjustCssFilter(adjust: MediaAdjust | undefined): string | undefined {
  if (
    !adjust ||
    (adjust.brightness === 0 &&
      adjust.contrast === 0 &&
      adjust.warmth === 0 &&
      adjust.saturation === 0 &&
      adjust.sharpness === 0)
  ) {
    return undefined;
  }
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
