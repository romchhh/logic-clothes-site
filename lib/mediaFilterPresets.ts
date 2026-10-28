import {
  DEFAULT_MEDIA_ADJUST,
  type MediaAdjust,
  mediaAdjustCssFilter,
} from "@/lib/mediaAdjust";
import {
  savedPresetFilterId,
  type SavedMediaPreset,
} from "@/lib/mediaAdjustPresetsStorage";

export type MediaFilterPreset = {
  id: string;
  label: string;
  tag?: string;
  adjust: MediaAdjust;
  accent: string;
  isUser?: boolean;
};

export type MediaFilterGroup = {
  id: string;
  title: string;
  presets: MediaFilterPreset[];
};

const BUILTIN: MediaFilterPreset[] = [
  {
    id: "original",
    label: "Оригінал",
    tag: "Без змін",
    adjust: DEFAULT_MEDIA_ADJUST,
    accent: "linear-gradient(145deg, #e8e8e8, #f5f5f5)",
  },
  {
    id: "catalog",
    label: "Каталог LC",
    tag: "Сайт",
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
    id: "mint",
    label: "Мʼята",
    tag: "Logic",
    adjust: {
      brightness: 8,
      contrast: 4,
      warmth: -6,
      saturation: 10,
      sharpness: 16,
    },
    accent: "linear-gradient(145deg, #B7E1DF, #7ec8c4)",
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
  {
    id: "studio",
    label: "Студія",
    tag: "Рівне світло",
    adjust: {
      brightness: 5,
      contrast: 14,
      warmth: 0,
      saturation: 4,
      sharpness: 20,
    },
    accent: "linear-gradient(145deg, #f0f0f0, #d0d0d0)",
  },
  {
    id: "window",
    label: "Вікно",
    tag: "Денне",
    adjust: {
      brightness: 14,
      contrast: -4,
      warmth: -12,
      saturation: 6,
      sharpness: 10,
    },
    accent: "linear-gradient(145deg, #e3f2fd, #fff)",
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
    id: "golden",
    label: "Золота година",
    tag: "Тепло",
    adjust: {
      brightness: 8,
      contrast: 8,
      warmth: 42,
      saturation: 14,
      sharpness: 12,
    },
    accent: "linear-gradient(145deg, #ffd89b, #f5af19)",
  },
  {
    id: "warm",
    label: "Теплий",
    tag: "Інтерʼєр",
    adjust: {
      brightness: 6,
      contrast: 10,
      warmth: 32,
      saturation: 10,
      sharpness: 12,
    },
    accent: "linear-gradient(145deg, #f5d4a8, #e8a87c)",
  },
  {
    id: "iphone-warm",
    label: "Жовтий iPhone",
    tag: "Виправити",
    adjust: {
      brightness: 4,
      contrast: 8,
      warmth: -22,
      saturation: 6,
      sharpness: 18,
    },
    accent: "linear-gradient(145deg, #fff8e1, #e0f7fa)",
  },
  {
    id: "cool",
    label: "Холодний",
    tag: "Хмарно",
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
    id: "iphone-cool",
    label: "Синій iPhone",
    tag: "Виправити",
    adjust: {
      brightness: 6,
      contrast: 10,
      warmth: 18,
      saturation: 4,
      sharpness: 18,
    },
    accent: "linear-gradient(145deg, #e1f5fe, #ffecb3)",
  },
  {
    id: "overcast",
    label: "Похмуро",
    tag: "Мʼяко",
    adjust: {
      brightness: 6,
      contrast: -8,
      warmth: -14,
      saturation: -12,
      sharpness: 8,
    },
    accent: "linear-gradient(145deg, #cfd8dc, #90a4ae)",
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
    id: "editorial",
    label: "Editorial",
    tag: "Журнал",
    adjust: {
      brightness: -4,
      contrast: 20,
      warmth: 6,
      saturation: 8,
      sharpness: 18,
    },
    accent: "linear-gradient(145deg, #212121, #757575)",
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
    id: "matte",
    label: "Матовий",
    tag: "Fade",
    adjust: {
      brightness: 4,
      contrast: -10,
      warmth: 8,
      saturation: -18,
      sharpness: 6,
    },
    accent: "linear-gradient(145deg, #d7ccc8, #efebe9)",
  },
  {
    id: "vintage",
    label: "Вінтаж",
    tag: "Плівка",
    adjust: {
      brightness: -2,
      contrast: 6,
      warmth: 24,
      saturation: -20,
      sharpness: 8,
    },
    accent: "linear-gradient(145deg, #8d6e63, #d7ccc8)",
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
    id: "night",
    label: "Вечір",
    tag: "Темніше",
    adjust: {
      brightness: -18,
      contrast: 12,
      warmth: 16,
      saturation: -8,
      sharpness: 12,
    },
    accent: "linear-gradient(145deg, #1a1a1a, #4a3728)",
  },
  {
    id: "crisp",
    label: "Різко",
    tag: "Відео",
    adjust: {
      brightness: 4,
      contrast: 16,
      warmth: 4,
      saturation: 6,
      sharpness: 38,
    },
    accent: "linear-gradient(145deg, #eceff1, #111)",
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
];

export const MEDIA_FILTER_PRESETS = BUILTIN;

export const MEDIA_FILTER_GROUPS: MediaFilterGroup[] = [
  {
    id: "brand",
    title: "Logic Clothes",
    presets: BUILTIN.filter((p) =>
      ["original", "catalog", "mint", "match", "studio"].includes(p.id)
    ),
  },
  {
    id: "light",
    title: "Світло і виправлення",
    presets: BUILTIN.filter((p) =>
      [
        "bright",
        "window",
        "golden",
        "warm",
        "cool",
        "overcast",
        "iphone-warm",
        "iphone-cool",
      ].includes(p.id)
    ),
  },
  {
    id: "style",
    title: "Стиль",
    presets: BUILTIN.filter((p) =>
      [
        "vivid",
        "soft",
        "matte",
        "vintage",
        "editorial",
        "cinema",
        "moody",
        "night",
        "crisp",
        "mono",
      ].includes(p.id)
    ),
  },
];

export function savedToFilterPreset(p: SavedMediaPreset): MediaFilterPreset {
  return {
    id: savedPresetFilterId(p.id),
    label: p.name,
    tag: "Заготовка",
    adjust: { ...p.adjust },
    accent: "linear-gradient(145deg, #B7E1DF, #111)",
    isUser: true,
  };
}

export function presetAdjust(
  id: string,
  saved: SavedMediaPreset[] = []
): MediaAdjust {
  const savedId = id.startsWith("saved:") ? id.slice(6) : null;
  if (savedId) {
    const u = saved.find((p) => p.id === savedId);
    if (u) return { ...u.adjust };
  }
  const p = BUILTIN.find((x) => x.id === id);
  return p ? { ...p.adjust } : { ...DEFAULT_MEDIA_ADJUST };
}

export function findMatchingPresetId(
  adjust: MediaAdjust,
  saved: SavedMediaPreset[] = []
): string | null {
  for (const p of saved) {
    if (adjustsEqual(p.adjust, adjust)) return savedPresetFilterId(p.id);
  }
  for (const p of BUILTIN) {
    if (p.id === "original") continue;
    if (adjustsEqual(p.adjust, adjust)) return p.id;
  }
  return adjustsEqual(adjust, DEFAULT_MEDIA_ADJUST) ? "original" : null;
}

function adjustsEqual(a: MediaAdjust, b: MediaAdjust): boolean {
  return (
    a.brightness === b.brightness &&
    a.contrast === b.contrast &&
    a.warmth === b.warmth &&
    a.saturation === b.saturation &&
    a.sharpness === b.sharpness
  );
}

export { mediaAdjustCssFilter };
