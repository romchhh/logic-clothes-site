/** Actual garment measurements filled in admin. Empty keys are omitted on the PDP. */

export const GARMENT_MEASURE_FIELDS = [
  { key: "length", label: "Довжина", labelEn: "Length" },
  {
    key: "sleeveFromShoulder",
    label: "Довжина рукава від плечового шва",
    labelEn: "Sleeve from shoulder seam",
  },
  {
    key: "lengthFromCollar",
    label: "Довжина від коміра (плечовий шов + рукав)",
    labelEn: "From collar (shoulder + sleeve)",
  },
  { key: "bust", label: "Обʼєм по грудях", labelEn: "Bust" },
  { key: "waist", label: "Обʼєм по талії", labelEn: "Waist" },
  { key: "hips", label: "Обʼєм по стегнах", labelEn: "Hips" },
  { key: "outerSeam", label: "Довжина зовнішнього шва", labelEn: "Outer seam" },
  { key: "innerSeam", label: "Довжина внутрішнього шва", labelEn: "Inner seam" },
  { key: "innerVolume", label: "Внутрішній обʼєм", labelEn: "Inner volume" },
  { key: "height", label: "Висота", labelEn: "Height" },
  { key: "width", label: "Ширина", labelEn: "Width" },
  { key: "strapLength", label: "Довжина ручок", labelEn: "Strap length" },
] as const;

export type GarmentMeasureKey = (typeof GARMENT_MEASURE_FIELDS)[number]["key"];
export type GarmentMeasures = Partial<Record<GarmentMeasureKey, string>>;

export function emptyGarmentMeasures(): Record<GarmentMeasureKey, string> {
  return Object.fromEntries(
    GARMENT_MEASURE_FIELDS.map((f) => [f.key, ""])
  ) as Record<GarmentMeasureKey, string>;
}

export function parseGarmentMeasures(raw: unknown): GarmentMeasures {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return {};
    try {
      obj = JSON.parse(t);
    } catch {
      return {};
    }
  }
  if (!obj || typeof obj !== "object") return {};
  const out: GarmentMeasures = {};
  for (const field of GARMENT_MEASURE_FIELDS) {
    const v = (obj as Record<string, unknown>)[field.key];
    if (typeof v === "string" && v.trim()) out[field.key] = v.trim();
    else if (typeof v === "number" && Number.isFinite(v)) out[field.key] = String(v);
  }
  return out;
}

export function hasGarmentMeasures(m: GarmentMeasures | null | undefined): boolean {
  return Boolean(m && Object.values(m).some((v) => v && String(v).trim()));
}
