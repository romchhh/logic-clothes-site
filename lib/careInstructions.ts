import { unstable_cache } from "next/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { query } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

export type CareId = "gentle" | "hand" | "dryclean" | "outer";

export type CareInstruction = {
  id: CareId;
  /** Short caption under the admin photo. */
  label: { uk: string; en: string };
  /** Expanded body on the product card. */
  body: { uk: string; en: string };
  /** Illustration (admin picker + optional PDP). */
  image: string;
};

export const CARE_SETTING_KEY = "care_instructions_json";

export const CARE_IDS: CareId[] = ["gentle", "hand", "dryclean", "outer"];

/** Default four care variants — overridden from admin when saved. */
export const DEFAULT_CARE_INSTRUCTIONS: CareInstruction[] = [
  {
    id: "gentle",
    label: {
      uk: "Делікатне прання",
      en: "Gentle wash",
    },
    body: {
      uk: "Прання при температурі до 30 °C, делікатний режим. Не відбілювати. Сушити в розправленому вигляді, без барабана. Прасувати з вивороту на низькій температурі.",
      en: "Wash at up to 30 °C on a gentle cycle. Do not bleach. Dry flat, no tumble dryer. Iron inside out on low heat.",
    },
    image: "/assets/care/gentle.svg",
  },
  {
    id: "hand",
    label: {
      uk: "Ручне прання",
      en: "Hand wash",
    },
    body: {
      uk: "Лише ручне прання в прохолодній воді з м’яким засобом. Не викручувати. Сушити на горизонтальній поверхні. Не відбілювати і не здавати в хімчистку без потреби.",
      en: "Hand wash only in cool water with a mild detergent. Do not wring. Dry flat. Do not bleach; avoid dry cleaning unless needed.",
    },
    image: "/assets/care/hand.svg",
  },
  {
    id: "dryclean",
    label: {
      uk: "Хімчистка",
      en: "Dry clean",
    },
    body: {
      uk: "Рекомендована професійна хімчистка. Не прати вдома. Не відбілювати. Зберігати на вішалці в чохлі, захищаючи від вологи й прямого сонця.",
      en: "Professional dry cleaning recommended. Do not wash at home. Do not bleach. Store on a hanger in a cover, away from moisture and direct sun.",
    },
    image: "/assets/care/dryclean.svg",
  },
  {
    id: "outer",
    label: {
      uk: "Верхній одяг",
      en: "Outerwear",
    },
    body: {
      uk: "Не прати в машинці. Протирати вологим м’яким рушником або здавати в хімчистку для мембранних / утеплених виробів. Сушити природним шляхом. Не прасувати по утеплювачу.",
      en: "Do not machine wash. Wipe with a soft damp cloth or dry-clean membrane / insulated pieces. Air dry. Do not iron over insulation.",
    },
    image: "/assets/care/outer.svg",
  },
];

/** @deprecated use getCareCatalog / DEFAULT_CARE_INSTRUCTIONS */
export const CARE_INSTRUCTIONS = DEFAULT_CARE_INSTRUCTIONS;

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

export function isCareId(value: unknown): value is CareId {
  return (
    value === "gentle" ||
    value === "hand" ||
    value === "dryclean" ||
    value === "outer"
  );
}

export function parseCareCatalog(raw: unknown): CareInstruction[] {
  const byId = new Map<CareId, CareInstruction>();
  for (const base of DEFAULT_CARE_INSTRUCTIONS) {
    byId.set(base.id, { ...base, label: { ...base.label }, body: { ...base.body } });
  }

  if (!Array.isArray(raw)) {
    return CARE_IDS.map((id) => byId.get(id)!);
  }

  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    if (!isCareId(item.id)) continue;
    const base = byId.get(item.id)!;
    const image = cleanUrl(String(item.image || item.src || "")) || base.image;
    const labelObj =
      item.label && typeof item.label === "object"
        ? (item.label as Record<string, unknown>)
        : null;
    const bodyObj =
      item.body && typeof item.body === "object"
        ? (item.body as Record<string, unknown>)
        : null;
    byId.set(item.id, {
      id: item.id,
      image,
      label: {
        uk: String(
          item.labelUk ?? labelObj?.uk ?? base.label.uk
        ).trim() || base.label.uk,
        en: String(
          item.labelEn ?? labelObj?.en ?? base.label.en
        ).trim() || base.label.en,
      },
      body: {
        uk: String(item.bodyUk ?? bodyObj?.uk ?? base.body.uk).trim() ||
          base.body.uk,
        en: String(item.bodyEn ?? bodyObj?.en ?? base.body.en).trim() ||
          base.body.en,
      },
    });
  }

  return CARE_IDS.map((id) => byId.get(id)!);
}

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

export function findCareInstruction(
  catalog: CareInstruction[],
  id: CareId | null | undefined
): CareInstruction | null {
  if (!id) return null;
  return catalog.find((c) => c.id === id) ?? null;
}

/** Sync lookup against defaults only — prefer getCareCatalog on the server. */
export function getCareInstruction(id: CareId | null | undefined) {
  if (!id) return null;
  return DEFAULT_CARE_INSTRUCTIONS.find((c) => c.id === id) ?? null;
}

export function careLabel(
  care: CareInstruction | null | undefined,
  lang: Locale
): string {
  if (!care) return "";
  return lang === "en" ? care.label.en : care.label.uk;
}

export function careBody(
  care: CareInstruction | null | undefined,
  lang: Locale
): string {
  if (!care) return "";
  return lang === "en" ? care.body.en : care.body.uk;
}
