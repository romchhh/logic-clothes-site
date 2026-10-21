import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export default function About({ lang }: { lang: Locale }) {
  const t = getMessages(lang);

  return (
    <section className="home-about" id="about">
      <h2 className="home-about-title">{t.home.aboutTitle}</h2>
      <p className="home-about-text">{t.home.aboutText}</p>
      <Link href={`/${lang}/about`} className="home-about-link">
        {t.home.aboutReadMore}
      </Link>
    </section>
  );
}
