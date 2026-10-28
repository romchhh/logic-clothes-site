import {
  DEFAULT_MEDIA_ADJUST,
  type MediaAdjust,
  mediaAdjustCssFilter,
} from "@/lib/mediaAdjust";

export type MediaFilterPreset = {
  id: string;
  label: string;
  tag?: string;
  adjust: MediaAdjust;
  accent: string;
};

export const MEDIA_FILTER_PRESETS: MediaFilterPreset[] = [
  {
    id: "original",
    label: "Оригінал",
    tag: "Без змін",
    adjust: DEFAULT_MEDIA_ADJUST,
    accent: "linear-gradient(145deg, #e8e8e8, #f5f5f5)",
  },
  {
    id: "catalog",
    label: "Каталог",
    tag: "Для сайту",
    adjust: {
      brightness: 4,
      contrast: 8,
      warmth: 2,
      saturation: 6,
      sharpness: 18,
    },
    accent: "linear-gradient(145deg, #B7E1DF, #f0faf9)",
  },
  {
    id: "bright",
    label: "Світло",
    tag: "Повітряно",
    adjust: {
      brightness: 12,
      contrast: -6,
      warmth: 4,
      saturation: 4,
      sharpness: 8,
    },
    accent: "linear-gradient(145deg, #fff9f0, #ffffff)",
  },
  {
    id: "warm",
    label: "Теплий",
    tag: "Золото",
    adjust: {
      brightness: 6,
      contrast: 10,
      warmth: 38,
      saturation: 12,
      sharpness: 12,
    },
    accent: "linear-gradient(145deg, #f5d4a8, #e8a87c)",
  },
  {
    id: "cool",
    label: "Холодний",
    tag: "Сірий день",
    adjust: {
      brightness: 2,
      contrast: 6,
      warmth: -32,
      saturation: -8,
      sharpness: 14,
    },
    accent: "linear-gradient(145deg, #c8d8e8, #8fa8bc)",
  },
  {
    id: "vivid",
    label: "Яскраво",
    tag: "Колір",
    adjust: {
      brightness: 8,
      contrast: 14,
      warmth: 6,
      saturation: 28,
      sharpness: 22,
    },
    accent: "linear-gradient(145deg, #ff8a80, #ffd54f)",
  },
  {
    id: "soft",
    label: "Ніжний",
    tag: "Пудра",
    adjust: {
      brightness: 10,
      contrast: -12,
      warmth: 14,
      saturation: -10,
      sharpness: 4,
    },
    accent: "linear-gradient(145deg, #fce4ec, #f8bbd0)",
  },
  {
    id: "cinema",
    label: "Кіно",
    tag: "Глибина",
    adjust: {
      brightness: -8,
      contrast: 22,
      warmth: 12,
      saturation: -6,
      sharpness: 16,
    },
    accent: "linear-gradient(145deg, #2c2c2c, #5c4a3a)",
  },
  {
    id: "moody",
    label: "Драма",
    tag: "Тіні",
    adjust: {
      brightness: -14,
      contrast: 18,
      warmth: -8,
      saturation: -14,
      sharpness: 10,
    },
    accent: "linear-gradient(145deg, #1a1a2e, #16213e)",
  },
  {
    id: "mono",
    label: "Ч/Б",
    tag: "Класика",
    adjust: {
      brightness: 4,
      contrast: 16,
      warmth: 0,
      saturation: -100,
      sharpness: 12,
    },
    accent: "linear-gradient(145deg, #666, #ccc)",
  },
  {
    id: "match",
    label: "Вирівняти",
    tag: "Фото + відео",
    adjust: {
      brightness: 6,
      contrast: 12,
      warmth: 10,
      saturation: 8,
      sharpness: 24,
    },
    accent: "linear-gradient(145deg, #111, #B7E1DF)",
  },
];

export function presetAdjust(id: string): MediaAdjust {
  const p = MEDIA_FILTER_PRESETS.find((x) => x.id === id);
  return p ? { ...p.adjust } : { ...DEFAULT_MEDIA_ADJUST };
}

export function findMatchingPresetId(adjust: MediaAdjust): string | null {
  for (const p of MEDIA_FILTER_PRESETS) {
    if (p.id === "original") continue;
    const a = p.adjust;
    if (
      a.brightness === adjust.brightness &&
      a.contrast === adjust.contrast &&
      a.warmth === adjust.warmth &&
      a.saturation === adjust.saturation &&
      a.sharpness === adjust.sharpness
    ) {
      return p.id;
    }
  }
  return adjust.brightness === 0 &&
    adjust.contrast === 0 &&
    adjust.warmth === 0 &&
    adjust.saturation === 0 &&
    adjust.sharpness === 0
    ? "original"
    : null;
}

export { mediaAdjustCssFilter };
