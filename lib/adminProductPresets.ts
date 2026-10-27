import type { Product } from "@/lib/types";

const FABRIC_NAMES_KEY = "lc_admin_fabric_names";
const COMPOSITIONS_KEY = "lc_admin_compositions";
const MODEL_PRESETS_KEY = "lc_admin_model_presets";

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

export function loadFabricNameSuggestions(): string[] {
  return readJson<string[]>(FABRIC_NAMES_KEY, []);
}

export function loadCompositionSuggestions(): string[] {
  return readJson<string[]>(COMPOSITIONS_KEY, []);
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
  const next = Array.from(
    new Set([...loadFabricNameSuggestions(), ...values.map((v) => v.trim())])
  ).filter(Boolean);
  writeJson(FABRIC_NAMES_KEY, next);
  return next;
}

export function rememberCompositions(values: string[]) {
  const next = Array.from(
    new Set([...loadCompositionSuggestions(), ...values.map((v) => v.trim())])
  ).filter(Boolean);
  writeJson(COMPOSITIONS_KEY, next);
  return next;
}

export function rememberFromProduct(
  product: Pick<
    Product,
    "material" | "materialOptions" | "photoSize" | "modelParams"
  >
) {
  if (product.material?.trim()) {
    rememberCompositions([product.material.trim()]);
  }
  if (product.materialOptions?.length) {
    rememberFabricNames(product.materialOptions);
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
  for (const p of products) {
    for (const m of p.materialOptions || []) {
      if (m.trim()) fabrics.add(m.trim());
    }
    if (p.material?.trim()) compositions.add(p.material.trim());
  }
  if (fabrics.size) rememberFabricNames([...fabrics]);
  if (compositions.size) rememberCompositions([...compositions]);
}

export function parseBulkList(raw: string): string[] {
  return Array.from(new Set(splitBulk(raw)));
}
