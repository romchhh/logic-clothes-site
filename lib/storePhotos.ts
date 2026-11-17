import { unstable_cache } from "next/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { query } from "@/lib/db";

export type StorePhoto = {
  src: string;
  altUk: string;
  altEn: string;
};

export const STORE_PHOTOS_SETTING_KEY = "store_photos_json";

/** Fallback when admin has not saved photos yet. */
export const DEFAULT_STORE_PHOTOS: StorePhoto[] = [
  {
    src: "/assets/footer-bg.png",
    altUk: "Магазин Logic Clothes у Києві",
    altEn: "Logic Clothes store in Kyiv",
  },
  {
    src: "/assets/hero.png",
    altUk: "Concept store на Софіївській, 5",
    altEn: "Concept store at Sofiivska 5",
  },
];

function cleanUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      return u.pathname || trimmed;
    }
  } catch {
    /* keep */
  }
  return trimmed.split("?")[0].split("#")[0];
}

export function parseStorePhotos(raw: unknown): StorePhoto[] {
  if (!Array.isArray(raw)) return [];
  const out: StorePhoto[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const src = cleanUrl(String(item.src || item.url || ""));
    if (!src) continue;
    out.push({
      src,
      altUk: String(item.altUk || item.alt || "").trim(),
      altEn: String(item.altEn || item.alt || "").trim(),
    });
  }
  return out;
}

async function loadStorePhotos(): Promise<StorePhoto[]> {
  try {
    const rows = await query<{ value: string }>(
      `SELECT value FROM site_settings WHERE key = $1`,
      [STORE_PHOTOS_SETTING_KEY]
    );
    const raw = rows[0]?.value;
    // No setting yet → show defaults. Explicit `[]` hides the block.
    if (raw == null || !String(raw).trim()) return DEFAULT_STORE_PHOTOS;
    return parseStorePhotos(JSON.parse(raw));
  } catch {
    return DEFAULT_STORE_PHOTOS;
  }
}

export const getStorePhotos = unstable_cache(
  loadStorePhotos,
  ["logic-clothes-store-photos"],
  { revalidate: 300, tags: ["store-photos"] }
);

/** Uncached read for admin UI. */
export async function getStorePhotosFresh(): Promise<StorePhoto[]> {
  return loadStorePhotos();
}

export async function saveStorePhotos(
  photos: StorePhoto[]
): Promise<StorePhoto[]> {
  const cleaned = parseStorePhotos(photos);
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [STORE_PHOTOS_SETTING_KEY, JSON.stringify(cleaned)]
  );
  bustStorePhotosCache();
  return cleaned;
}

export function bustStorePhotosCache() {
  try {
    revalidateTag("store-photos");
    revalidatePath("/uk");
    revalidatePath("/en");
  } catch {
    /* ignore outside request */
  }
}
