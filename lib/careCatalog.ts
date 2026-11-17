import { unstable_cache } from "next/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { query } from "@/lib/db";
import {
  CARE_SETTING_KEY,
  DEFAULT_CARE_INSTRUCTIONS,
  parseCareCatalog,
  type CareInstruction,
} from "@/lib/careInstructions";

async function loadCareCatalog(): Promise<CareInstruction[]> {
  try {
    const rows = await query<{ value: string }>(
      `SELECT value FROM site_settings WHERE key = $1`,
      [CARE_SETTING_KEY]
    );
    const raw = rows[0]?.value;
    if (!raw?.trim()) return DEFAULT_CARE_INSTRUCTIONS;
    return parseCareCatalog(JSON.parse(raw));
  } catch {
    return DEFAULT_CARE_INSTRUCTIONS;
  }
}

export const getCareCatalog = unstable_cache(
  loadCareCatalog,
  ["logic-clothes-care-catalog"],
  { revalidate: 300, tags: ["care-catalog"] }
);

export async function getCareCatalogFresh(): Promise<CareInstruction[]> {
  return loadCareCatalog();
}

export async function saveCareCatalog(
  items: CareInstruction[]
): Promise<CareInstruction[]> {
  const cleaned = parseCareCatalog(items);
  await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW()`,
    [CARE_SETTING_KEY, JSON.stringify(cleaned)]
  );
  bustCareCatalogCache();
  return cleaned;
}

export function bustCareCatalogCache() {
  try {
    revalidateTag("care-catalog");
    revalidatePath("/uk");
    revalidatePath("/en");
  } catch {
    /* ignore */
  }
}
