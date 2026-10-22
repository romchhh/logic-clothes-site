import { unstable_cache } from "next/cache";
import { revalidatePath, revalidateTag } from "next/cache";
import { getMessages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";
import { getSettings } from "@/lib/settings";

export type HeroContent = {
  image: string;
  imagePosition: string;
  since: { uk: string; en: string };
  title: { uk: string; en: string };
  subtitle: { uk: string; en: string };
};

const DEFAULT_IMAGE = "/assets/hero.png";
const DEFAULT_POSITION = "center 22%";

function defaults(): HeroContent {
  const uk = getMessages("uk").home;
  const en = getMessages("en").home;
  return {
    image: DEFAULT_IMAGE,
    imagePosition: DEFAULT_POSITION,
    since: { uk: uk.since, en: en.since },
    title: { uk: "", en: "" },
    subtitle: { uk: "", en: "" },
  };
}

async function loadHeroContent(): Promise<HeroContent> {
  const base = defaults();
  try {
    const s = await getSettings();
    return {
      image: s.hero_image?.trim() || base.image,
      imagePosition: s.hero_image_position?.trim() || base.imagePosition,
      since: {
        uk: s.hero_since_uk?.trim() || base.since.uk,
        en: s.hero_since_en?.trim() || base.since.en,
      },
      title: {
        uk: s.hero_title_uk?.trim() || "",
        en: s.hero_title_en?.trim() || "",
      },
      subtitle: {
        uk: s.hero_subtitle_uk?.trim() || "",
        en: s.hero_subtitle_en?.trim() || "",
      },
    };
  } catch {
    return base;
  }
}

export const getHeroContent = unstable_cache(
  loadHeroContent,
  ["logic-clothes-hero"],
  { revalidate: 300, tags: ["hero"] }
);

export function heroText(
  content: HeroContent,
  lang: Locale
): { since: string; title: string; subtitle: string } {
  return {
    since: content.since[lang] || content.since.uk,
    title: content.title[lang] || content.title.uk,
    subtitle: content.subtitle[lang] || content.subtitle.uk,
  };
}

export function bustHeroCache() {
  try {
    revalidateTag("hero");
    revalidatePath("/uk");
    revalidatePath("/en");
  } catch {
    /* ignore outside request */
  }
}
