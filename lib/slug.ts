/** Ukrainian / Cyrillic → Latin for URL-safe slugs. */
const CYR_MAP: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "yu",
  я: "ya",
  ъ: "",
  ы: "y",
  э: "e",
};

function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    const lower = ch.toLowerCase();
    if (CYR_MAP[lower] !== undefined) {
      const mapped = CYR_MAP[lower];
      out += ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
    } else {
      out += ch;
    }
  }
  return out;
}

/** Build a URL-safe Latin slug from any label (UK/EN). */
export function slugifyId(input: string): string {
  const latin = transliterate(input)
    .toLowerCase()
    .trim()
    .replace(/['"`’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-")
    .slice(0, 64);

  return latin || `item-${Date.now().toString(36)}`;
}

/** Prefer EN label for Latin slug; fall back to UK. */
export function slugFromLabels(label: {
  uk?: string;
  en?: string;
}): string {
  const en = label.en?.trim() || "";
  const uk = label.uk?.trim() || "";
  return slugifyId(en || uk);
}
