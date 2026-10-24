import Image from "next/image";
import type { Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/config";
import { heroText, type HeroContent } from "@/lib/hero";
import HeroCategories from "@/components/main-page/HeroCategories";

export default function Hero({
  lang,
  categories,
  content,
}: {
  lang: Locale;
  categories: Category[];
  content: HeroContent;
}) {
  const copy = heroText(content, lang);
  const showCopy = Boolean(copy.title || copy.subtitle);

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <Image
          src={content.image || "/assets/hero.png"}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          style={{
            objectFit: "cover",
            objectPosition: content.imagePosition || "center 22%",
          }}
        />
      </div>

      <div className="home-hero-ui">
        {showCopy && (
          <div className="home-hero-copy">
            {copy.title ? <h1 className="home-hero-title">{copy.title}</h1> : null}
            {copy.subtitle ? (
              <p className="home-hero-subtitle">{copy.subtitle}</p>
            ) : null}
          </div>
        )}

        <div className="hero-cats-anchor">
          <HeroCategories lang={lang} categories={categories} />
        </div>

        <div className="home-ua-mark">
          <span className="home-ua-flag" aria-hidden="true">
            <Image
              src="/assets/ua-flag-brush.png"
              alt=""
              fill
              sizes="(max-width: 1100px) 72px, 88px"
              quality={85}
              style={{ objectFit: "contain", objectPosition: "left center" }}
            />
          </span>
          <span className="home-ua-since">{copy.since}</span>
        </div>
      </div>
    </div>
  );
}
