export type OrderVariantFields = {
  size?: string | null;
  sizeLabel?: string | null;
  length?: string | null;
  material?: string | null;
  color?: string | null;
};

export type VariantLine = { label: string; value: string };

const UK = {
  size: "Розмір",
  length: "Довжина",
  material: "Матеріал",
  color: "Колір",
} as const;

/** Build unique cart/order line key from selected options. */
export function buildVariantKey(parts: {
  size?: string | null;
  length?: string | null;
  material?: string | null;
  color?: string | null;
}): string {
  return [parts.size, parts.length, parts.material, parts.color]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(" · ");
}

/** Prefer structured fields; fall back to parsing the legacy size string. */
export function resolveVariantFields(item: OrderVariantFields): {
  size: string | null;
  length: string | null;
  material: string | null;
  color: string | null;
} {
  const length = String(item.length || "").trim() || null;
  const material = String(item.material || "").trim() || null;
  const color = String(item.color || "").trim() || null;
  const sizeLabel = String(item.sizeLabel || "").trim() || null;

  if (sizeLabel || length || material || color) {
    return {
      size: sizeLabel || String(item.size || "").trim() || null,
      length,
      material,
      color,
    };
  }

  const raw = String(item.size || "").trim();
  if (!raw) {
    return { size: null, length: null, material: null, color: null };
  }

  const parts = raw.split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { size: raw, length: null, material: null, color: null };
  }

  return {
    size: parts[0] || null,
    length: parts[1] || null,
    material: parts[2] || null,
    color: parts[3] || null,
  };
}

export function variantLines(
  item: OrderVariantFields,
  labels: { size: string; length: string; material: string; color: string } = UK
): VariantLine[] {
  const v = resolveVariantFields(item);
  const lines: VariantLine[] = [];
  if (v.size) lines.push({ label: labels.size, value: v.size });
  if (v.length) lines.push({ label: labels.length, value: v.length });
  if (v.material) lines.push({ label: labels.material, value: v.material });
  if (v.color) lines.push({ label: labels.color, value: v.color });
  if (!lines.length && item.size) {
    lines.push({ label: labels.size, value: String(item.size) });
  }
  return lines;
}

export function variantSummary(
  item: OrderVariantFields,
  labels?: { size: string; length: string; material: string; color: string }
): string {
  return variantLines(item, labels)
    .map((l) => `${l.label}: ${l.value}`)
    .join(" · ");
}
