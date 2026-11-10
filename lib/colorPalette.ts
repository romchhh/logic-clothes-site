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

/** 8 families × 9 shades — brand board: 3×3 paint dabs per card. */
export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    id: "greens",
    label: "зелена палітра",
    labelEn: "green palette",
    shades: [
      { id: "green-deep", label: "Темно-зелений", labelEn: "Deep green", hex: "#1A3D2C" },
      { id: "green-forest", label: "Ліс", labelEn: "Forest", hex: "#2D5A3D" },
      { id: "green", label: "Зелений", labelEn: "Green", hex: "#3F7A4E" },
      { id: "olive", label: "Оливковий", labelEn: "Olive", hex: "#6B8F3F" },
      { id: "khaki", label: "Хакі", labelEn: "Khaki", hex: "#8FA85A" },
      { id: "green-sage", label: "Шалфей", labelEn: "Sage", hex: "#9BB88A" },
      { id: "mint", label: "Мʼятний", labelEn: "Mint", hex: "#A8D9A0" },
      { id: "mint-light", label: "Світла мʼята", labelEn: "Light mint", hex: "#C8E8C0" },
      { id: "green-pale", label: "Пастель зелений", labelEn: "Pale green", hex: "#E2F2DC" },
    ],
  },
  {
    id: "reds",
    label: "червона палітра",
    labelEn: "red palette",
    shades: [
      { id: "burgundy", label: "Бордо", labelEn: "Burgundy", hex: "#5C1520" },
      { id: "red-deep", label: "Темно-червоний", labelEn: "Deep red", hex: "#8B1A22" },
      { id: "red", label: "Червоний", labelEn: "Red", hex: "#C4282E" },
      { id: "red-brick", label: "Цегла", labelEn: "Brick", hex: "#D4453A" },
      { id: "coral", label: "Корал", labelEn: "Coral", hex: "#E06A55" },
      { id: "red-rose", label: "Троянда", labelEn: "Rose", hex: "#E88878" },
      { id: "powder", label: "Пудра", labelEn: "Powder", hex: "#F0A898" },
      { id: "red-blush", label: "Румʼянець", labelEn: "Blush", hex: "#F5C4B8" },
      { id: "red-pale", label: "Ніжно-рожевий", labelEn: "Pale rose", hex: "#FAE0DA" },
    ],
  },
  {
    id: "yellows",
    label: "жовта палітра",
    labelEn: "yellow palette",
    shades: [
      { id: "mustard", label: "Гірчичний", labelEn: "Mustard", hex: "#A67C12" },
      { id: "gold", label: "Золото", labelEn: "Gold", hex: "#C9A227" },
      { id: "chocolate", label: "Охра", labelEn: "Ochre", hex: "#D4A82A" },
      { id: "brown", label: "Медовий", labelEn: "Honey", hex: "#E0B83A" },
      { id: "camel", label: "Жовтий", labelEn: "Yellow", hex: "#E8C84A" },
      { id: "sand", label: "Сонячний", labelEn: "Sunny", hex: "#F0D65C" },
      { id: "beige", label: "Вершковий", labelEn: "Butter", hex: "#F5E28A" },
      { id: "cream", label: "Кремовий", labelEn: "Cream", hex: "#F8EBB0" },
      { id: "ivory", label: "Слонова кістка", labelEn: "Ivory", hex: "#FBF5D8" },
    ],
  },
  {
    id: "oranges",
    label: "помаранчева палітра",
    labelEn: "orange palette",
    shades: [
      { id: "orange-rust", label: "Теракота", labelEn: "Rust", hex: "#8B3A1E" },
      { id: "orange-deep", label: "Темний помаранч", labelEn: "Deep orange", hex: "#C24E22" },
      { id: "orange", label: "Помаранчевий", labelEn: "Orange", hex: "#E06A28" },
      { id: "orange-coral", label: "Кораловий", labelEn: "Coral orange", hex: "#E88745" },
      { id: "orange-apricot", label: "Абрикос", labelEn: "Apricot", hex: "#F09A58" },
      { id: "orange-salmon", label: "Лосось", labelEn: "Salmon", hex: "#F2B078" },
      { id: "orange-peach", label: "Персик", labelEn: "Peach", hex: "#F5C498" },
      { id: "orange-pale", label: "Світлий персик", labelEn: "Pale peach", hex: "#FAD9C0" },
      { id: "multi", label: "Мульти", labelEn: "Multi", hex: "#FFFFFF" },
    ],
  },
  {
    id: "neutrals",
    label: "сіра палітра",
    labelEn: "grey palette",
    shades: [
      { id: "black", label: "Чорний", labelEn: "Black", hex: "#111111" },
      { id: "charcoal", label: "Вугілля", labelEn: "Charcoal", hex: "#2E2E2E" },
      { id: "graphite", label: "Графіт", labelEn: "Graphite", hex: "#4A4A4A" },
      { id: "grey", label: "Сірий", labelEn: "Grey", hex: "#7A7A7A" },
      { id: "silver", label: "Срібло", labelEn: "Silver", hex: "#A8A8A8" },
      { id: "smoke", label: "Дим", labelEn: "Smoke", hex: "#C4C4C4" },
      { id: "light-grey", label: "Світло-сірий", labelEn: "Light grey", hex: "#DCDCDC" },
      { id: "off-white", label: "Молочний", labelEn: "Off white", hex: "#F0F0F0" },
      { id: "white", label: "Білий", labelEn: "White", hex: "#FAFAFA" },
    ],
  },
  {
    id: "blues",
    label: "синя палітра",
    labelEn: "blue palette",
    shades: [
      { id: "navy", label: "Navy", labelEn: "Navy", hex: "#0C1A2E" },
      { id: "navy-blue", label: "Синій", labelEn: "Blue", hex: "#1A3A5C" },
      { id: "blue-deep", label: "Глибокий синій", labelEn: "Deep blue", hex: "#2A5580" },
      { id: "blue-steel", label: "Сталевий", labelEn: "Steel blue", hex: "#3D7AA8" },
      { id: "blue", label: "Блакитний", labelEn: "Sky", hex: "#5A9EC8" },
      { id: "blue-sky", label: "Небесний", labelEn: "Sky light", hex: "#7EB8DC" },
      { id: "blue-ice", label: "Крижаний", labelEn: "Ice", hex: "#A8D4EC" },
      { id: "blue-pale", label: "Пастель блакитний", labelEn: "Pale blue", hex: "#D0E8F5" },
      { id: "blue-white", label: "Біло-блакитний", labelEn: "Powder blue", hex: "#EAF4FA" },
    ],
  },
  {
    id: "purples",
    label: "фіолетова палітра",
    labelEn: "purple palette",
    shades: [
      { id: "purple-deep", label: "Темно-фіолет", labelEn: "Deep purple", hex: "#2E1A40" },
      { id: "purple", label: "Фіолетовий", labelEn: "Purple", hex: "#4A2A62" },
      { id: "purple-plum", label: "Сливовий", labelEn: "Plum", hex: "#6A3A7A" },
      { id: "purple-violet", label: "Фіалка", labelEn: "Violet", hex: "#8A5AA0" },
      { id: "lavender", label: "Лаванда", labelEn: "Lavender", hex: "#B08AC8" },
      { id: "purple-lilac", label: "Бузок", labelEn: "Lilac", hex: "#C8A8DC" },
      { id: "purple-mauve", label: "Мальва", labelEn: "Mauve", hex: "#DCC0E8" },
      { id: "purple-orchid", label: "Орхідея", labelEn: "Orchid", hex: "#EAD8F2" },
      { id: "purple-pale", label: "Пастель лаванда", labelEn: "Pale lilac", hex: "#F5EEF8" },
    ],
  },
  {
    id: "pinks",
    label: "рожева палітра",
    labelEn: "pink palette",
    shades: [
      { id: "pink-fuchsia", label: "Фуксія", labelEn: "Fuchsia", hex: "#B01058" },
      { id: "pink-hot", label: "Яскраво-рожевий", labelEn: "Hot pink", hex: "#E02878" },
      { id: "pink", label: "Рожевий", labelEn: "Pink", hex: "#E868A0" },
      { id: "pink-rose", label: "Рожа", labelEn: "Rose pink", hex: "#EC88B4" },
      { id: "pink-ballet", label: "Балет", labelEn: "Ballet", hex: "#F0A8C8" },
      { id: "pink-candy", label: "Цукерка", labelEn: "Candy pink", hex: "#F5C0D8" },
      { id: "pink-shell", label: "Перламутр", labelEn: "Shell", hex: "#F8D4E4" },
      { id: "pink-powder", label: "Пудровий", labelEn: "Powder pink", hex: "#FCE8F0" },
      { id: "pink-pale", label: "Ніжний", labelEn: "Pale pink", hex: "#FFF4F8" },
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

/** Which paint family a shade belongs to (pink, beige, …). */
export function groupForPaletteId(
  id: string | null | undefined
): PaletteGroup | null {
  if (!id) return null;
  return PALETTE_GROUPS.find((g) => g.shades.some((s) => s.id === id)) ?? null;
}

/** A representative dab colour for a family when no SKU is linked. */
export function paintGroupPreviewHex(group: PaletteGroup): string {
  const mid = group.shades[Math.floor(group.shades.length / 2)];
  return mid?.hex || group.shades[0]?.hex || "#ccc";
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
  const { byPalette } = resolveMembers(current, family);

  return COLOR_PALETTE.map((palette) => {
    const variant = byPalette.get(palette.id) ?? null;
    return {
      palette,
      variant,
      isCurrent: variant?.id === current.id,
    };
  });
}

/** PDP: colors on this model (family + extra swatches on one SKU). */
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
