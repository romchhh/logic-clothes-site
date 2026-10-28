import type { MediaAdjust } from "@/lib/mediaAdjust";
import { normalizeMediaAdjust } from "@/lib/mediaAdjust";

const STORAGE_KEY = "lc_admin_media_tone_presets";
const LAST_PRESET_KEY = "lc_admin_media_last_preset_id";

export type SavedMediaPreset = {
  id: string;
  name: string;
  adjust: MediaAdjust;
  createdAt: string;
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

export function loadSavedMediaPresets(): SavedMediaPreset[] {
  const list = readJson<SavedMediaPreset[]>(STORAGE_KEY, []);
  return list
    .map((p) => {
      const adjust = normalizeMediaAdjust(p.adjust);
      if (!adjust || !p.name?.trim()) return null;
      return {
        id: String(p.id),
        name: p.name.trim(),
        adjust,
        createdAt: p.createdAt || new Date().toISOString(),
      };
    })
    .filter((p): p is SavedMediaPreset => Boolean(p))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function saveSavedMediaPresets(list: SavedMediaPreset[]) {
  writeJson(STORAGE_KEY, list);
}

export function addSavedMediaPreset(
  name: string,
  adjust: MediaAdjust
): SavedMediaPreset[] {
  const trimmed = name.trim();
  if (!trimmed) return loadSavedMediaPresets();
  const entry: SavedMediaPreset = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed.slice(0, 48),
    adjust: { ...adjust },
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...loadSavedMediaPresets()].slice(0, 24);
  saveSavedMediaPresets(next);
  return next;
}

export function removeSavedMediaPreset(id: string): SavedMediaPreset[] {
  const next = loadSavedMediaPresets().filter((p) => p.id !== id);
  saveSavedMediaPresets(next);
  return next;
}

export function rememberLastMediaPresetId(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id) {
    localStorage.removeItem(LAST_PRESET_KEY);
    return;
  }
  try {
    localStorage.setItem(LAST_PRESET_KEY, id);
  } catch {
    /* ignore */
  }
}

export function loadLastMediaPresetId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_PRESET_KEY);
}

export function savedPresetFilterId(id: string): string {
  return `saved:${id}`;
}

export function parseSavedPresetFilterId(filterId: string): string | null {
  return filterId.startsWith("saved:") ? filterId.slice(6) : null;
}
