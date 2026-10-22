import Image from "next/image";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import HeroCategories from "@/components/main-page/HeroCategories";

export default function Hero({
  lang,
  categories,
}: {
  lang: Locale;
  categories: Category[];
}) {
  const t = getMessages(lang);

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <Image
          src="/assets/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          style={{ objectFit: "cover", objectPosition: "center 22%" }}
        />
      </div>

      <div className="home-hero-ui">
        <div className="hero-cats-anchor">
          <HeroCategories lang={lang} categories={categories} />
        </div>

        <div className="home-ua-mark">
          <span className="home-ua-flag" aria-hidden="true">
            <span className="home-ua-brush home-ua-brush--blue" />
            <span className="home-ua-brush home-ua-brush--yellow" />
          </span>
          <span className="home-ua-since">{t.home.since}</span>
        </div>
      </div>
    </div>
  );
}
