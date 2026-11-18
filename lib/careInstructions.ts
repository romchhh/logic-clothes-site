import type { Locale } from "@/lib/i18n/config";

/** Four fabric-care groups (matches brand care sheet). */
export type CareId = "outer" | "eco" | "natural" | "delicate";

export type CareStep = {
  /** Icon file under /assets/care/icons/ */
  icon: string;
  text: { uk: string; en: string };
};

export type CareInstruction = {
  id: CareId;
  /** Short caption under the admin / PDP photo. */
  label: { uk: string; en: string };
  /** Plain-text fallback (also used if steps empty). */
  body: { uk: string; en: string };
  /** Photo from the care sheet. */
  image: string;
  /** Icon rows as on the care sheet. */
  steps: CareStep[];
};

export const CARE_SETTING_KEY = "care_instructions_json";

export const CARE_IDS: CareId[] = ["outer", "eco", "natural", "delicate"];

/** Legacy product.careId values → current ids. */
const CARE_ID_ALIASES: Record<string, CareId> = {
  outer: "outer",
  eco: "eco",
  natural: "natural",
  delicate: "delicate",
  // previous admin defaults
  hand: "eco",
  gentle: "natural",
  dryclean: "delicate",
};

function icon(name: string) {
  return `/assets/care/icons/${name}.svg`;
}

function stepsToBody(steps: CareStep[]): { uk: string; en: string } {
  return {
    uk: steps.map((s) => `• ${s.text.uk}`).join("\n"),
    en: steps.map((s) => `• ${s.text.en}`).join("\n"),
  };
}

const OUTER_STEPS: CareStep[] = [
  {
    icon: icon("wash30"),
    text: {
      uk: "делікатний режим пральної машини 30°",
      en: "delicate machine wash 30°",
    },
  },
  {
    icon: icon("handwash"),
    text: { uk: "ручне прання 30°", en: "hand wash 30°" },
  },
  {
    icon: icon("shake"),
    text: {
      uk: "розтрусити / розправити після прання",
      en: "shake out / smooth after washing",
    },
  },
  {
    icon: icon("no-tumble"),
    text: {
      uk: "не сушити в сушильній машині",
      en: "do not tumble dry",
    },
  },
  {
    icon: icon("dry-flat"),
    text: {
      uk: "сушити горизонтально на рушнику",
      en: "dry flat on a towel",
    },
  },
  {
    icon: icon("no-soak"),
    text: { uk: "не замочувати", en: "do not soak" },
  },
  {
    icon: icon("iron-steam"),
    text: {
      uk: "обережне прасування через щільну тканину. вертикальне відпарювання",
      en: "careful ironing through a cloth; vertical steaming",
    },
  },
];

const ECO_STEPS: CareStep[] = [
  {
    icon: icon("wash30"),
    text: {
      uk: "делікатний режим пральної машини 30°",
      en: "delicate machine wash 30°",
    },
  },
  {
    icon: icon("handwash"),
    text: { uk: "ручне прання 30°", en: "hand wash 30°" },
  },
  {
    icon: icon("no-wring"),
    text: {
      uk: "не викручувати / не віджимати",
      en: "do not wring / do not spin",
    },
  },
  {
    icon: icon("no-tumble"),
    text: {
      uk: "не сушити в сушильній машині",
      en: "do not tumble dry",
    },
  },
  {
    icon: icon("dry-flat"),
    text: {
      uk: "сушити горизонтально на рушнику",
      en: "dry flat on a towel",
    },
  },
  {
    icon: icon("no-soak"),
    text: { uk: "не замочувати", en: "do not soak" },
  },
  {
    icon: icon("iron"),
    text: {
      uk: "обережне прасування через щільну тканину",
      en: "careful ironing through a cloth",
    },
  },
  {
    icon: icon("no-sun"),
    text: {
      uk: "не пересушувати на сонці та в сухому кліматі",
      en: "do not overdry in the sun or dry climate",
    },
  },
  {
    icon: icon("hanger"),
    text: {
      uk: "зберігати на тремпелі / не складати",
      en: "store on a hanger / do not fold",
    },
  },
];

const NATURAL_STEPS: CareStep[] = [
  {
    icon: icon("wash30"),
    text: {
      uk: "делікатний режим пральної машини 30°",
      en: "delicate machine wash 30°",
    },
  },
  {
    icon: icon("handwash"),
    text: { uk: "ручне прання 30°", en: "hand wash 30°" },
  },
  {
    icon: icon("similar-colors"),
    text: {
      uk: "прати зі схожими кольорами",
      en: "wash with similar colours",
    },
  },
  {
    icon: icon("light-spin"),
    text: { uk: "легкий віджим", en: "light spin" },
  },
  {
    icon: icon("no-soak"),
    text: { uk: "не замочувати", en: "do not soak" },
  },
  {
    icon: icon("no-tumble"),
    text: {
      uk: "не сушити в сушильній машині",
      en: "do not tumble dry",
    },
  },
  {
    icon: icon("iron-steam"),
    text: {
      uk: "обережне прасування через щільну тканину. вертикальне відпарювання",
      en: "careful ironing through a cloth; vertical steaming",
    },
  },
];

const DELICATE_STEPS: CareStep[] = [
  {
    icon: icon("handwash"),
    text: {
      uk: "обережне ручне прання 30°",
      en: "gentle hand wash 30°",
    },
  },
  {
    icon: icon("no-soak"),
    text: { uk: "не замочувати", en: "do not soak" },
  },
  {
    icon: icon("no-machine"),
    text: {
      uk: "не прати в пральній машині",
      en: "do not machine wash",
    },
  },
  {
    icon: icon("no-wring"),
    text: { uk: "не викручувати", en: "do not wring" },
  },
  {
    icon: icon("dryclean"),
    text: {
      uk: "перевірена хімчистка",
      en: "trusted dry cleaning",
    },
  },
  {
    icon: icon("iron"),
    text: {
      uk: "легке прасування через бавовняну тканину або вертикальне відпарювання",
      en: "light ironing through cotton cloth or vertical steaming",
    },
  },
  {
    icon: icon("hanger-cover"),
    text: {
      uk: "зберігати на тремпелі / в чохлі, бажано не складати",
      en: "store on a hanger / in a cover; preferably do not fold",
    },
  },
];

/** Default four care variants — overridden from admin when saved. */
export const DEFAULT_CARE_INSTRUCTIONS: CareInstruction[] = [
  {
    id: "outer",
    label: {
      uk: "верхній одяг / плащівки / тренчі / утеплювачі",
      en: "outerwear / raincoats / trenches / insulation",
    },
    image: "/assets/care/outer.jpg",
    steps: OUTER_STEPS,
    body: stepsToBody(OUTER_STEPS),
  },
  {
    id: "eco",
    label: {
      uk: "екошкіра",
      en: "eco-leather",
    },
    image: "/assets/care/eco.jpg",
    steps: ECO_STEPS,
    body: stepsToBody(ECO_STEPS),
  },
  {
    id: "natural",
    label: {
      uk: "натуральні та змішані тканини",
      en: "natural & mixed fabrics",
    },
    image: "/assets/care/natural.jpg",
    steps: NATURAL_STEPS,
    body: stepsToBody(NATURAL_STEPS),
  },
  {
    id: "delicate",
    label: {
      uk: "тендітні тканини (шовк, сітка, шифон, атлас, софт)",
      en: "delicate fabrics (silk, mesh, chiffon, satin, soft)",
    },
    image: "/assets/care/delicate.jpg",
    steps: DELICATE_STEPS,
    body: stepsToBody(DELICATE_STEPS),
  },
];

/** @deprecated use DEFAULT_CARE_INSTRUCTIONS */
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

export function resolveCareId(value: unknown): CareId | null {
  if (typeof value !== "string" || !value) return null;
  return CARE_ID_ALIASES[value] ?? null;
}

export function isCareId(value: unknown): value is CareId {
  return resolveCareId(value) !== null;
}

function parseSteps(
  raw: unknown,
  fallback: CareStep[]
): CareStep[] {
  if (!Array.isArray(raw) || !raw.length) return fallback.map((s) => ({
    ...s,
    text: { ...s.text },
  }));
  const out: CareStep[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const iconPath = cleanUrl(String(item.icon || "")) || icon("wash30");
    const textObj =
      item.text && typeof item.text === "object"
        ? (item.text as Record<string, unknown>)
        : null;
    const uk = String(item.textUk ?? textObj?.uk ?? "").trim();
    const en = String(item.textEn ?? textObj?.en ?? "").trim();
    if (!uk && !en) continue;
    out.push({
      icon: iconPath,
      text: { uk: uk || en, en: en || uk },
    });
  }
  return out.length ? out : fallback.map((s) => ({ ...s, text: { ...s.text } }));
}

export function parseCareCatalog(raw: unknown): CareInstruction[] {
  const byId = new Map<CareId, CareInstruction>();
  for (const base of DEFAULT_CARE_INSTRUCTIONS) {
    byId.set(base.id, {
      ...base,
      label: { ...base.label },
      body: { ...base.body },
      steps: base.steps.map((s) => ({ ...s, text: { ...s.text } })),
    });
  }

  if (!Array.isArray(raw)) {
    return CARE_IDS.map((id) => byId.get(id)!);
  }

  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const rawId = String(item.id ?? "");
    const id = resolveCareId(rawId);
    if (!id) continue;
    // Skip legacy slug overlays (gentle/hand/dryclean) — keep new sheet defaults
    if (rawId !== id) continue;
    const base = byId.get(id)!;
    const image = cleanUrl(String(item.image || item.src || "")) || base.image;
    const labelObj =
      item.label && typeof item.label === "object"
        ? (item.label as Record<string, unknown>)
        : null;
    const bodyObj =
      item.body && typeof item.body === "object"
        ? (item.body as Record<string, unknown>)
        : null;
    const steps = parseSteps(item.steps, base.steps);
    const bodyFromSteps = stepsToBody(steps);
    byId.set(id, {
      id,
      image,
      label: {
        uk:
          String(item.labelUk ?? labelObj?.uk ?? base.label.uk).trim() ||
          base.label.uk,
        en:
          String(item.labelEn ?? labelObj?.en ?? base.label.en).trim() ||
          base.label.en,
      },
      body: {
        uk:
          String(item.bodyUk ?? bodyObj?.uk ?? "").trim() ||
          bodyFromSteps.uk,
        en:
          String(item.bodyEn ?? bodyObj?.en ?? "").trim() ||
          bodyFromSteps.en,
      },
      steps,
    });
  }

  return CARE_IDS.map((id) => byId.get(id)!);
}

export function findCareInstruction(
  catalog: CareInstruction[],
  id: CareId | string | null | undefined
): CareInstruction | null {
  const resolved = resolveCareId(id);
  if (!resolved) return null;
  return catalog.find((c) => c.id === resolved) ?? null;
}

/** Sync lookup against defaults only — prefer getCareCatalog on the server. */
export function getCareInstruction(id: CareId | string | null | undefined) {
  return findCareInstruction(DEFAULT_CARE_INSTRUCTIONS, id);
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

export function careStepText(step: CareStep, lang: Locale): string {
  return lang === "en" ? step.text.en : step.text.uk;
}
