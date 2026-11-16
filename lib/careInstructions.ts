import type { Locale } from "@/lib/i18n/config";

export type CareId = "gentle" | "hand" | "dryclean" | "outer";

export type CareInstruction = {
  id: CareId;
  /** Short caption under the admin photo. */
  label: { uk: string; en: string };
  /** Expanded body on the product card. */
  body: { uk: string; en: string };
  /** Optional illustration (admin + PDP). */
  image: string;
};

/** Four care variants — pick one photo in admin per product. */
export const CARE_INSTRUCTIONS: CareInstruction[] = [
  {
    id: "gentle",
    label: {
      uk: "делікатне прання",
      en: "gentle wash",
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
      uk: "ручне прання",
      en: "hand wash",
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
      uk: "хімчистка",
      en: "dry clean",
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
      uk: "верхній одяг",
      en: "outerwear",
    },
    body: {
      uk: "Не прати в машинці. Протирати вологим м’яким рушником або здавати в хімчистку для мембранних / утеплених виробів. Сушити природним шляхом. Не прасувати по утеплювачу.",
      en: "Do not machine wash. Wipe with a soft damp cloth or dry-clean membrane / insulated pieces. Air dry. Do not iron over insulation.",
    },
    image: "/assets/care/outer.svg",
  },
];

export function isCareId(value: unknown): value is CareId {
  return (
    value === "gentle" ||
    value === "hand" ||
    value === "dryclean" ||
    value === "outer"
  );
}

export function getCareInstruction(id: CareId | null | undefined) {
  if (!id) return null;
  return CARE_INSTRUCTIONS.find((c) => c.id === id) ?? null;
}

export function careLabel(id: CareId, lang: Locale): string {
  const row = getCareInstruction(id);
  if (!row) return "";
  return lang === "en" ? row.label.en : row.label.uk;
}

export function careBody(id: CareId, lang: Locale): string {
  const row = getCareInstruction(id);
  if (!row) return "";
  return lang === "en" ? row.body.en : row.body.uk;
}
