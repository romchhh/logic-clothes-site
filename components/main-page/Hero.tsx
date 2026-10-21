import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function Hero({ lang }: { lang: Locale }) {
  const t = getMessages(lang);

  return (
    <div className="home-hero-stage">
      <div className="home-hero">
        <Image
          src="/assets/hero.png"
          alt="Logic Clothes — жіночий одяг"
          fill
          priority
          sizes="100vw"
          quality={85}
          style={{ objectFit: "cover", objectPosition: "center 22%" }}
        />
      </div>
      <div className="home-content">
        <div className="home-cta-wrap">
          <Link href={`/${lang}/catalog`} className="home-cta">
            {t.home.cta}
          </Link>
        </div>
        <div className="home-bottom">
          <div className="home-copy">
            <div className="eyebrow">{t.home.eyebrow}</div>
            <p>{t.home.lead}</p>
          </div>
          <div className="home-title">LOGIC</div>
        </div>
      </div>
    </div>
  );
}
