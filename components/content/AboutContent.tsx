import ContentPage from "@/components/shared/ContentPage";
import { aboutContent } from "@/lib/content/about";
import type { Locale } from "@/lib/i18n/config";

export default function AboutContent({ lang }: { lang: Locale }) {
  const c = aboutContent[lang];

  return (
    <>
      <div className="about-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/footer-bg.png"
          alt=""
          aria-hidden="true"
        />
      </div>

      <ContentPage title={c.title} lead={c.lead}>
        <section className="content-block" id="custom-order">
          <h2>
            {lang === "uk"
              ? "Ваш колір + ваш розмір за 14 днів"
              : "Your colour + your size in 14 days"}
          </h2>
          <p>
            {lang === "uk"
              ? "Будь-який відтінок з нашої палітри — стандартна сітка або по ваших мірках. На сторінці товару оберіть колір і натисніть «Обговорити замовлення з живою людиною» — менеджер відповість у Instagram або Viber."
              : "Any shade from our palette — standard sizes or made to measure. On the product page pick a colour and tap «Discuss your order with a real person» — our manager will reply on Instagram or Viber."}
          </p>
        </section>

        <section className="content-block">
          <h2>{c.sectionTitle}</h2>
          <ul className="content-list">
            {c.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <figure className="about-quote">
          <figcaption className="about-quote-title">{c.closingTitle}</figcaption>
          <blockquote>
            {c.closing.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </blockquote>
        </figure>
      </ContentPage>
    </>
  );
}
