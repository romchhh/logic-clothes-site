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

export type PaletteGroup = {
  id: string;
  label: string;
  labelEn: string;
  shades: PaletteColor[];
};

/** 8 families × 9 shades — layout like brand reference board (3×3 per group). */
export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: "greens",
    label: "Зелені",
    labelEn: "Greens",
    shades: [
      { id: "green-deep", label: "Темно-зелений", labelEn: "Deep green", hex: "#1B4332" },
      { id: "green", label: "Зелений", labelEn: "Green", hex: "#2F6B4F" },
      { id: "olive", label: "Оливковий", labelEn: "Olive", hex: "#6B7F3B" },
      { id: "khaki", label: "Хакі", labelEn: "Khaki", hex: "#8A7E5A" },
      { id: "green-forest", label: "Ліс", labelEn: "Forest", hex: "#234E3A" },
      { id: "green-sage", label: "Шалфей", labelEn: "Sage", hex: "#8FA88B" },
      { id: "mint", label: "Мʼятний", labelEn: "Mint", hex: "#B7E1DF" },
      { id: "mint-light", label: "Світла мʼята", labelEn: "Light mint", hex: "#D4EDE9" },
      { id: "green-pale", label: "Пастель зелений", labelEn: "Pale green", hex: "#E8F2EE" },
    ],
  },
  {
    id: "reds",
    label: "Червоні",
    labelEn: "Reds",
    shades: [
      { id: "burgundy", label: "Бордо", labelEn: "Burgundy", hex: "#6B1E2A" },
      { id: "red-deep", label: "Темно-червоний", labelEn: "Deep red", hex: "#8B1A1A" },
      { id: "red", label: "Червоний", labelEn: "Red", hex: "#B91C1C" },
      { id: "red-brick", label: "Цегла", labelEn: "Brick", hex: "#A63D3D" },
      { id: "coral", label: "Корал", labelEn: "Coral", hex: "#E07A5F" },
      { id: "red-rose", label: "Троянда", labelEn: "Rose", hex: "#D46A7A" },
      { id: "powder", label: "Пудра", labelEn: "Powder", hex: "#F2C4C4" },
      { id: "red-blush", label: "Румʼянець", labelEn: "Blush", hex: "#F5D0D8" },
      { id: "red-pale", label: "Ніжно-рожевий", labelEn: "Pale rose", hex: "#FAE8EC" },
    ],
  },
  {
    id: "yellows",
    label: "Жовті",
    labelEn: "Yellows",
    shades: [
      { id: "chocolate", label: "Шоколад", labelEn: "Chocolate", hex: "#3D2314" },
      { id: "brown", label: "Коричневий", labelEn: "Brown", hex: "#5C4033" },
      { id: "camel", label: "Кемел", labelEn: "Camel", hex: "#A67B5B" },
      { id: "sand", label: "Пісок", labelEn: "Sand", hex: "#C2A878" },
      { id: "mustard", label: "Гірчичний", labelEn: "Mustard", hex: "#C4A035" },
      { id: "gold", label: "Золото", labelEn: "Gold", hex: "#C9A227" },
      { id: "cream", label: "Кремовий", labelEn: "Cream", hex: "#E8DCC8" },
      { id: "beige", label: "Беж", labelEn: "Beige", hex: "#D4C4A8" },
      { id: "ivory", label: "Слонова кістка", labelEn: "Ivory", hex: "#F2EDE4" },
    ],
  },
  {
    id: "oranges",
    label: "Помаранчеві",
    labelEn: "Oranges",
    shades: [
      { id: "orange-rust", label: "Теракота", labelEn: "Rust", hex: "#8B3A2A" },
      { id: "orange-deep", label: "Темний помаранч", labelEn: "Deep orange", hex: "#B84E2E" },
      { id: "orange", label: "Помаранчевий", labelEn: "Orange", hex: "#E07B39" },
      { id: "orange-coral", label: "Кораловий", labelEn: "Coral orange", hex: "#E8956A" },
      { id: "multi", label: "Мульти", labelEn: "Multi", hex: "#FFFFFF" },
      { id: "orange-apricot", label: "Абрикос", labelEn: "Apricot", hex: "#F0A878" },
      { id: "orange-peach", label: "Персик", labelEn: "Peach", hex: "#F5C4A0" },
      { id: "orange-salmon", label: "Лосось", labelEn: "Salmon", hex: "#F2B8A2" },
      { id: "orange-pale", label: "Світлий персик", labelEn: "Pale peach", hex: "#FAD9C8" },
    ],
  },
  {
    id: "neutrals",
    label: "Сірі",
    labelEn: "Neutrals",
    shades: [
      { id: "black", label: "Чорний", labelEn: "Black", hex: "#111111" },
      { id: "graphite", label: "Графіт", labelEn: "Graphite", hex: "#4A4A4A" },
      { id: "charcoal", label: "Вугілля", labelEn: "Charcoal", hex: "#333333" },
      { id: "grey", label: "Сірий", labelEn: "Grey", hex: "#8A8A8A" },
      { id: "silver", label: "Срібло", labelEn: "Silver", hex: "#C0C0C0" },
      { id: "smoke", label: "Дим", labelEn: "Smoke", hex: "#B5B5B5" },
      { id: "white", label: "Білий", labelEn: "White", hex: "#F5F5F5" },
      { id: "off-white", label: "Молочний", labelEn: "Off white", hex: "#FAFAFA" },
      { id: "light-grey", label: "Світло-сірий", labelEn: "Light grey", hex: "#E5E5E5" },
    ],
  },
  {
    id: "blues",
    label: "Сині",
    labelEn: "Blues",
    shades: [
      { id: "navy", label: "Navy", labelEn: "Navy", hex: "#0F1C2E" },
      { id: "navy-blue", label: "Синій", labelEn: "Blue", hex: "#1E3A5F" },
      { id: "blue-deep", label: "Глибокий синій", labelEn: "Deep blue", hex: "#2A5080" },
      { id: "blue", label: "Блакитний", labelEn: "Sky", hex: "#7EB6D9" },
      { id: "blue-steel", label: "Сталевий", labelEn: "Steel blue", hex: "#6B8FA8" },
      { id: "blue-sky", label: "Небесний", labelEn: "Sky light", hex: "#A8D4E8" },
      { id: "blue-ice", label: "Крижаний", labelEn: "Ice", hex: "#D4EAF5" },
      { id: "blue-pale", label: "Пастель блакитний", labelEn: "Pale blue", hex: "#E8F4FA" },
      { id: "blue-white", label: "Біло-блакитний", labelEn: "Powder blue", hex: "#F0F8FC" },
    ],
  },
  {
    id: "purples",
    label: "Фіолетові",
    labelEn: "Purples",
    shades: [
      { id: "purple-deep", label: "Темно-фіолет", labelEn: "Deep purple", hex: "#3D2454" },
      { id: "purple", label: "Фіолетовий", labelEn: "Purple", hex: "#5B3A6E" },
      { id: "purple-plum", label: "Сливовий", labelEn: "Plum", hex: "#6E4578" },
      { id: "purple-violet", label: "Фіалка", labelEn: "Violet", hex: "#7B5A9E" },
      { id: "lavender", label: "Лаванда", labelEn: "Lavender", hex: "#C5B4D6" },
      { id: "purple-lilac", label: "Бузок", labelEn: "Lilac", hex: "#D8C8E8" },
      { id: "purple-mauve", label: "Мальва", labelEn: "Mauve", hex: "#E0D0E8" },
      { id: "purple-orchid", label: "Орхідея", labelEn: "Orchid", hex: "#EADCF2" },
      { id: "purple-pale", label: "Пастель лаванда", labelEn: "Pale lilac", hex: "#F5EEF8" },
    ],
  },
  {
    id: "pinks",
    label: "Рожеві",
    labelEn: "Pinks",
    shades: [
      { id: "pink-fuchsia", label: "Фуксія", labelEn: "Fuchsia", hex: "#C2185B" },
      { id: "pink-hot", label: "Яскраво-рожевий", labelEn: "Hot pink", hex: "#E0408A" },
      { id: "pink", label: "Рожевий", labelEn: "Pink", hex: "#E8A0BF" },
      { id: "pink-rose", label: "Рожа", labelEn: "Rose pink", hex: "#EBA8C4" },
      { id: "pink-ballet", label: "Балет", labelEn: "Ballet", hex: "#F2C0D4" },
      { id: "pink-candy", label: "Цукерка", labelEn: "Candy pink", hex: "#F8D4E4" },
      { id: "pink-shell", label: "Перламутр", labelEn: "Shell", hex: "#FCE4EE" },
      { id: "pink-powder", label: "Пудровий", labelEn: "Powder pink", hex: "#FFF0F5" },
      { id: "pink-pale", label: "Ніжний", labelEn: "Pale pink", hex: "#FFF8FA" },
    ],
  },
];

export const COLOR_PALETTE: PaletteColor[] = PALETTE_GROUPS.flatMap(
  (g) => g.shades
);

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
  фуксія: "pink-fuchsia",
  fuchsia: "pink-fuchsia",
  теракота: "orange-rust",
  шалфей: "green-sage",
  sage: "green-sage",
  вугілля: "charcoal",
  charcoal: "charcoal",
};

export function getPaletteColor(id: string): PaletteColor | undefined {
  return BY_ID.get(id);
}

/** Admin / API: palette slots stored on one SKU (primary + extra swatches). */
export function productPaletteSelection(product: {
  color?: string;
  colorHex?: string;
  swatches?: Array<{ label: string; hex?: string }>;
}): { ids: string[]; primaryId: string | null } {
  const ids: string[] = [];
  const seen = new Set<string>();
  const primaryId =
    resolvePaletteId({
      color: product.color,
      colorHex: product.colorHex,
    }) ?? null;

  if (primaryId) {
    ids.push(primaryId);
    seen.add(primaryId);
  }
  for (const sw of product.swatches || []) {
    const id = resolvePaletteId({
      color: sw.label,
      colorHex: sw.hex,
      hex: sw.hex,
    });
    if (id && !seen.has(id)) {
      ids.push(id);
      seen.add(id);
    }
  }
  return { ids, primaryId: primaryId ?? ids[0] ?? null };
}

export function swatchesFromPaletteIds(
  ids: string[],
  img: string
): Array<{ img: string; label: string; hex: string }> {
  const out: Array<{ img: string; label: string; hex: string }> = [];
  for (const id of ids) {
    const c = getPaletteColor(id);
    if (!c) continue;
    out.push({ img, label: c.label, hex: c.hex });
  }
  return out;
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

export function getPaletteGroups(): PaletteGroup[] {
  return PALETTE_GROUPS;
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

function resolveMembers(
  current: {
    id: string;
    color?: string;
    colorHex?: string;
    images?: string[];
    name?: string;
  },
  family: PaletteSlotVariant[]
): { self: PaletteSlotVariant; byPalette: Map<string, PaletteSlotVariant> } {
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

  if (!members.some((m) => m.id === current.id)) {
    members.push(self);
  }

  const byPalette = new Map<string, PaletteSlotVariant>();
  for (const m of members) {
    if (!m.paletteId) continue;
    const existing = byPalette.get(m.paletteId);
    if (!existing || m.id === current.id) {
      byPalette.set(m.paletteId, m);
    }
  }

  return { self, byPalette };
}

/** Full brand palette (admin preview / made-to-order slots). */
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
  const { self, byPalette } = resolveMembers(current, family);

  return COLOR_PALETTE.map((palette) => {
    const variant = byPalette.get(palette.id) ?? null;
    return {
      palette,
      variant,
      isCurrent: variant?.id === current.id,
    };
  });
}

/**
 * PDP: only colors that exist in this model’s family — with photo in the circle.
 */
export function buildFamilyPaletteSlots(
  current: {
    id: string;
    color?: string;
    colorHex?: string;
    images?: string[];
    name?: string;
    swatches?: Array<{ label: string; hex?: string }>;
  },
  family: PaletteSlotVariant[]
): PaletteSlot[] {
  const { self, byPalette } = resolveMembers(current, family);

  for (const sw of current.swatches || []) {
    const paletteId = resolvePaletteId({
      color: sw.label,
      colorHex: sw.hex,
      hex: sw.hex,
    });
    if (!paletteId || byPalette.has(paletteId)) continue;
    byPalette.set(paletteId, {
      id: current.id,
      name: current.name || "",
      color: sw.label,
      image: current.images?.[0] || "",
      hex: sw.hex,
      paletteId,
    });
  }

  const activePaletteId = resolvePaletteId({
    color: current.color,
    colorHex: current.colorHex,
  });

  const ordered: PaletteSlot[] = [];
  for (const palette of COLOR_PALETTE) {
    const variant = byPalette.get(palette.id);
    if (!variant) continue;
    const sameProduct = variant.id === current.id;
    ordered.push({
      palette,
      variant,
      isCurrent: sameProduct
        ? activePaletteId
          ? palette.id === activePaletteId
          : ordered.length === 0
        : variant.id === current.id,
    });
  }

  if (ordered.length > 0) return ordered;

  if (!self.color && !self.hex && !self.image) return [];

  const customHex = normalizeHex(self.hex) || "#CCCCCC";
  const customPalette: PaletteColor = self.paletteId
    ? (getPaletteColor(self.paletteId) ?? {
        id: self.paletteId,
        label: self.color || self.paletteId,
        labelEn: self.color || self.paletteId,
        hex: customHex,
      })
    : {
        id: "custom",
        label: self.color || "Колір",
        labelEn: self.color || "Color",
        hex: customHex,
      };

  return [
    {
      palette: customPalette,
      variant: self,
      isCurrent: true,
    },
  ];
}
