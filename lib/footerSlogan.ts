import { unstable_cache } from "next/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";
import { getSettings } from "@/lib/settings";

export type FooterSloganContent = {
  slogan: { uk: string; en: string };
  accent: { uk: string; en: string };
};

function defaults(): FooterSloganContent {
  const uk = getMessages("uk").footer;
  const en = getMessages("en").footer;
  return {
    slogan: { uk: uk.slogan, en: en.slogan },
    accent: { uk: uk.sloganAccent, en: en.sloganAccent },
  };
}

async function loadFooterSlogan(): Promise<FooterSloganContent> {
  const base = defaults();
  try {
    const s = await getSettings();
    return {
      slogan: {
        uk: s.footer_slogan_uk?.trim() || base.slogan.uk,
        en: s.footer_slogan_en?.trim() || base.slogan.en,
      },
      accent: {
        uk: s.footer_slogan_accent_uk?.trim() || base.accent.uk,
        en: s.footer_slogan_accent_en?.trim() || base.accent.en,
      },
    };
  } catch {
    return base;
  }
}

export const getFooterSlogan = unstable_cache(
  loadFooterSlogan,
  ["logic-clothes-footer-slogan"],
  { revalidate: 300, tags: ["footer-slogan"] }
);

export function footerSloganText(
  content: FooterSloganContent,
  lang: Locale
): { slogan: string; accent: string } {
  return {
    slogan: content.slogan[lang] || content.slogan.uk,
    accent: content.accent[lang] || content.accent.uk,
  };
}

export function bustFooterSloganCache() {
  try {
    revalidateTag("footer-slogan");
    revalidatePath("/uk");
    revalidatePath("/en");
  } catch {
    /* ignore outside request */
  }
}
