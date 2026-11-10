import type { Product } from "@/lib/types";

const FABRIC_NAMES_KEY = "lc_admin_fabric_names";
const COMPOSITIONS_KEY = "lc_admin_compositions";
const LINING_KEY = "lc_admin_linings";
const LINING_COMPOSITION_KEY = "lc_admin_lining_compositions";
const INSULATION_KEY = "lc_admin_insulations";
const MODEL_PRESETS_KEY = "lc_admin_model_presets";

export type SuggestKind =
  | "fabricName"
  | "composition"
  | "lining"
  | "liningComposition"
  | "insulation";

const SUGGEST_KEYS: Record<SuggestKind, string> = {
  fabricName: FABRIC_NAMES_KEY,
  composition: COMPOSITIONS_KEY,
  lining: LINING_KEY,
  liningComposition: LINING_COMPOSITION_KEY,
  insulation: INSULATION_KEY,
};

const DEFAULT_SUGGESTS: Record<SuggestKind, string[]> = {
  fabricName: [
    "Шовк",
    "Бавовна",
    "Льон",
    "Вовна",
    "Трикотаж",
    "Віскоза",
    "Шкіра",
    "Екошкіра",
    "Денім",
    "Креп",
    "Сітка",
    "Атлас",
    "Плащова",
  ],
  composition: [
    "100% поліестер",
    "100% бавовна",
    "100% віскоза",
    "95% бавовна, 5% еластан",
    "80% вовна, 20% поліестер",
  ],
  lining: ["Підкладка", "Віскоза", "Поліестер", "Атлас", "Сітка"],
  liningComposition: ["100% віскоза", "100% поліестер", "100% ацетат"],
  insulation: ["Силікон 100", "Силікон 200", "Холлофайбер", "Пух", "Без утеплювача"],
};

export type ModelPreset = {
  id: string;
  internalName: string;
  photoSize: string;
  modelParams: string;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function uniq(values: string[]): string[] {
  return Array.from(
    new Set(values.map((v) => v.trim()).filter(Boolean))
  );
}

export function loadSuggestions(kind: SuggestKind): string[] {
  const stored = readJson<string[]>(SUGGEST_KEYS[kind], []);
  return uniq([...DEFAULT_SUGGESTS[kind], ...stored]);
}

export function rememberSuggestions(
  kind: SuggestKind,
  values: string[]
): string[] {
  const next = uniq([...loadSuggestions(kind), ...values]);
  writeJson(SUGGEST_KEYS[kind], next);
  return next;
}

export function loadFabricNameSuggestions(): string[] {
  return loadSuggestions("fabricName");
}

export function loadCompositionSuggestions(): string[] {
  return loadSuggestions("composition");
}

export function loadModelPresets(): ModelPreset[] {
  return readJson<ModelPreset[]>(MODEL_PRESETS_KEY, []);
}

export function saveModelPresets(presets: ModelPreset[]) {
  writeJson(MODEL_PRESETS_KEY, presets);
}

function splitBulk(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function rememberFabricNames(values: string[]) {
  return rememberSuggestions("fabricName", values);
}

export function rememberCompositions(values: string[]) {
  return rememberSuggestions("composition", values);
}

export function rememberFromProduct(
  product: Pick<
    Product,
    | "material"
    | "materialOptions"
    | "fabricName"
    | "lining"
    | "liningComposition"
    | "insulation"
    | "photoSize"
    | "modelParams"
  >
) {
  if (product.fabricName?.trim()) {
    rememberSuggestions("fabricName", [product.fabricName.trim()]);
  }
  if (product.material?.trim()) {
    rememberCompositions([product.material.trim()]);
  }
  if (product.materialOptions?.length) {
    rememberFabricNames(product.materialOptions);
  }
  if (product.lining?.trim()) {
    rememberSuggestions("lining", [product.lining.trim()]);
  }
  if (product.liningComposition?.trim()) {
    rememberSuggestions("liningComposition", [
      product.liningComposition.trim(),
    ]);
  }
  if (product.insulation?.trim()) {
    rememberSuggestions("insulation", [product.insulation.trim()]);
  }
  if (product.photoSize?.trim() || product.modelParams?.trim()) {
    const presets = loadModelPresets();
    const photoSize = product.photoSize?.trim() || "";
    const modelParams = product.modelParams?.trim() || "";
    const exists = presets.some(
      (p) => p.photoSize === photoSize && p.modelParams === modelParams
    );
    if (!exists && (photoSize || modelParams)) {
      presets.push({
        id: `auto-${Date.now()}`,
        internalName: photoSize || modelParams.slice(0, 24) || "Модель",
        photoSize,
        modelParams,
      });
      saveModelPresets(presets.slice(-40));
    }
  }
}

export function rememberFromCatalog(products: Product[]) {
  const fabrics = new Set<string>();
  const compositions = new Set<string>();
  const linings = new Set<string>();
  const liningComps = new Set<string>();
  const insulations = new Set<string>();

  for (const p of products) {
    for (const m of p.materialOptions || []) {
      if (m.trim()) fabrics.add(m.trim());
    }
    if (p.fabricName?.trim()) fabrics.add(p.fabricName.trim());
    if (p.material?.trim()) compositions.add(p.material.trim());
    if (p.lining?.trim()) linings.add(p.lining.trim());
    if (p.liningComposition?.trim()) {
      liningComps.add(p.liningComposition.trim());
    }
    if (p.insulation?.trim()) insulations.add(p.insulation.trim());
  }

  if (fabrics.size) rememberFabricNames([...fabrics]);
  if (compositions.size) rememberCompositions([...compositions]);
  if (linings.size) rememberSuggestions("lining", [...linings]);
  if (liningComps.size) {
    rememberSuggestions("liningComposition", [...liningComps]);
  }
  if (insulations.size) rememberSuggestions("insulation", [...insulations]);
}

export function parseBulkList(raw: string): string[] {
  return Array.from(new Set(splitBulk(raw)));
}
