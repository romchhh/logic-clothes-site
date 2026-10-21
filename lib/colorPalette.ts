/**
 * Fixed brand color system — same swatches on every product.
 * Each SKU maps to one palette slot; siblings in a colorGroup
 * cover other slots and link between PDP pages.
 */

export type PaletteColor = {
  /** Stable id used for matching & linking */
  id: string;
  label: string;
  labelEn: string;
  hex: string;
};

export const COLOR_PALETTE: PaletteColor[] = [
  { id: "black", label: "Чорний", labelEn: "Black", hex: "#111111" },
  { id: "white", label: "Білий", labelEn: "White", hex: "#F5F5F5" },
  { id: "ivory", label: "Слонова кістка", labelEn: "Ivory", hex: "#F2EDE4" },
  { id: "beige", label: "Беж", labelEn: "Beige", hex: "#D4C4A8" },
  { id: "cream", label: "Кремовий", labelEn: "Cream", hex: "#E8DCC8" },
  { id: "sand", label: "Пісок", labelEn: "Sand", hex: "#C2A878" },
  { id: "camel", label: "Кемел", labelEn: "Camel", hex: "#A67B5B" },
  { id: "brown", label: "Коричневий", labelEn: "Brown", hex: "#5C4033" },
  { id: "chocolate", label: "Шоколад", labelEn: "Chocolate", hex: "#3D2314" },
  { id: "grey", label: "Сірий", labelEn: "Grey", hex: "#8A8A8A" },
  { id: "graphite", label: "Графіт", labelEn: "Graphite", hex: "#4A4A4A" },
  { id: "silver", label: "Срібло", labelEn: "Silver", hex: "#C0C0C0" },
  { id: "red", label: "Червоний", labelEn: "Red", hex: "#B91C1C" },
  { id: "burgundy", label: "Бордо", labelEn: "Burgundy", hex: "#6B1E2A" },
  { id: "pink", label: "Рожевий", labelEn: "Pink", hex: "#E8A0BF" },
  { id: "powder", label: "Пудра", labelEn: "Powder", hex: "#F2C4C4" },
  { id: "coral", label: "Корал", labelEn: "Coral", hex: "#E07A5F" },
  { id: "orange", label: "Помаранчевий", labelEn: "Orange", hex: "#E07B39" },
  { id: "mustard", label: "Гірчичний", labelEn: "Mustard", hex: "#C4A035" },
  { id: "olive", label: "Оливковий", labelEn: "Olive", hex: "#6B7F3B" },
  { id: "khaki", label: "Хакі", labelEn: "Khaki", hex: "#8A7E5A" },
  { id: "green", label: "Зелений", labelEn: "Green", hex: "#2F6B4F" },
  { id: "mint", label: "Мʼятний", labelEn: "Mint", hex: "#B7E1DF" },
  { id: "blue", label: "Блакитний", labelEn: "Sky", hex: "#7EB6D9" },
  { id: "navy-blue", label: "Синій", labelEn: "Blue", hex: "#1E3A5F" },
  { id: "navy", label: "Navy", labelEn: "Navy", hex: "#0F1C2E" },
  { id: "purple", label: "Фіолетовий", labelEn: "Purple", hex: "#5B3A6E" },
  { id: "lavender", label: "Лаванда", labelEn: "Lavender", hex: "#C5B4D6" },
  { id: "gold", label: "Золото", labelEn: "Gold", hex: "#C9A227" },
  { id: "multi", label: "Мульти", labelEn: "Multi", hex: "#FFFFFF" },
];

const BY_ID = new Map(COLOR_PALETTE.map((c) => [c.id, c]));

const LABEL_ALIASES: Record<string, string> = {
  чорний: "black",
  black: "black",
  білий: "white",
  white: "white",
  "слонова кістка": "ivory",
  ivory: "ivory",
  беж: "beige",
  beige: "beige",
  кремовий: "cream",
  cream: "cream",
  пісок: "sand",
  sand: "sand",
  кемел: "camel",
  camel: "camel",
  коричневий: "brown",
  brown: "brown",
  шоколад: "chocolate",
  chocolate: "chocolate",
  сірий: "grey",
  gray: "grey",
  grey: "grey",
  графіт: "graphite",
  graphite: "graphite",
  срібло: "silver",
  silver: "silver",
  червоний: "red",
  red: "red",
  бордо: "burgundy",
  burgundy: "burgundy",
  рожевий: "pink",
  pink: "pink",
  фуксія: "pink",
  fuchsia: "pink",
  пудра: "powder",
  powder: "powder",
  корал: "coral",
  coral: "coral",
  помаранчевий: "orange",
  orange: "orange",
  жовтий: "mustard",
  yellow: "mustard",
  гірчичний: "mustard",
  mustard: "mustard",
  оливковий: "olive",
  olive: "olive",
  хакі: "khaki",
  khaki: "khaki",
  зелений: "green",
  green: "green",
  "м'ятний": "mint",
  "мʼятний": "mint",
  mint: "mint",
  блакитний: "blue",
  sky: "blue",
  синій: "navy-blue",
  blue: "navy-blue",
  navy: "navy",
  фіолетовий: "purple",
  purple: "purple",
  чорничний: "purple",
  лаванда: "lavender",
  лавандовий: "lavender",
  lavender: "lavender",
  золото: "gold",
  gold: "gold",
  мульти: "multi",
  multi: "multi",
  принт: "multi",
  print: "multi",
};

export function getPaletteColor(id: string): PaletteColor | undefined {
  return BY_ID.get(id);
}

export function normalizeHex(hex: string | null | undefined): string | null {
  if (!hex) return null;
  let h = hex.trim().replace(/^#/, "").toUpperCase();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9A-F]{6}$/.test(h)) return null;
  return `#${h}`;
}

function hexDistance(a: string, b: string): number {
  const pa = a.slice(1);
  const pb = b.slice(1);
  const dr = parseInt(pa.slice(0, 2), 16) - parseInt(pb.slice(0, 2), 16);
  const dg = parseInt(pa.slice(2, 4), 16) - parseInt(pb.slice(2, 4), 16);
  const db = parseInt(pa.slice(4, 6), 16) - parseInt(pb.slice(4, 6), 16);
  return dr * dr + dg * dg + db * db;
}

/** Map free-text / hex to a fixed palette slot. */
export function resolvePaletteId(input: {
  color?: string | null;
  colorHex?: string | null;
  hex?: string | null;
}): string | null {
  const label = (input.color || "").trim().toLowerCase();
  if (label && LABEL_ALIASES[label]) return LABEL_ALIASES[label];

  for (const c of COLOR_PALETTE) {
    if (c.label.toLowerCase() === label || c.labelEn.toLowerCase() === label) {
      return c.id;
    }
  }

  const hex = normalizeHex(input.colorHex || input.hex);
  if (!hex) return null;

  for (const c of COLOR_PALETTE) {
    if (normalizeHex(c.hex) === hex) return c.id;
  }

  // Nearest brand swatch (skip multi — it's a pattern, not a hue)
  let best: PaletteColor | null = null;
  let bestDist = Infinity;
  for (const c of COLOR_PALETTE) {
    if (c.id === "multi") continue;
    const d = hexDistance(hex, c.hex);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  // ~ sqrt(180^2) ≈ loose match; avoid forcing unrelated hues
  if (best && bestDist <= 40_000) return best.id;
  return null;
}

export function paletteLabel(
  id: string,
  lang: "uk" | "en" = "uk"
): string {
  const c = BY_ID.get(id);
  if (!c) return id;
  return lang === "en" ? c.labelEn : c.label;
}

export type PaletteSlotVariant = {
  id: string;
  name: string;
  color: string;
  image: string;
  hex?: string;
  paletteId?: string | null;
};

export type PaletteSlot = {
  palette: PaletteColor;
  /** Linked SKU in this color, if it exists in the color family */
  variant: PaletteSlotVariant | null;
  isCurrent: boolean;
};

/** Build the fixed palette row for a PDP. */
export function buildPaletteSlots(
  current: {
    id: string;
    color?: string;
    colorHex?: string;
    images?: string[];
    name?: string;
  },
  family: PaletteSlotVariant[]
): PaletteSlot[] {
  const self: PaletteSlotVariant = {
    id: current.id,
    name: current.name || "",
    color: current.color || "",
    image: current.images?.[0] || "",
    hex: current.colorHex,
    paletteId: resolvePaletteId({
      color: current.color,
      colorHex: current.colorHex,
    }),
  };

  const members = family.length
    ? family.map((v) => ({
        ...v,
        paletteId:
          v.paletteId ??
          resolvePaletteId({ color: v.color, colorHex: v.hex, hex: v.hex }),
      }))
    : [self];

  // Ensure current is in the map
  if (!members.some((m) => m.id === current.id)) {
    members.push(self);
  }

  const byPalette = new Map<string, PaletteSlotVariant>();
  for (const m of members) {
    if (!m.paletteId) continue;
    // Prefer current product if two claim same slot
    const existing = byPalette.get(m.paletteId);
    if (!existing || m.id === current.id) {
      byPalette.set(m.paletteId, m);
    }
  }

  return COLOR_PALETTE.map((palette) => {
    const variant = byPalette.get(palette.id) ?? null;
    return {
      palette,
      variant,
      isCurrent: variant?.id === current.id,
    };
  });
}
