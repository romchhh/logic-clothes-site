import type { Locale } from "@/lib/i18n/config";
import { getLegalPage } from "@/lib/content/legal";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_MAP_EMBED,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";

export default function ContactsContent({ lang }: { lang: Locale }) {
  const page = getLegalPage(lang, "contacts");
  if (!page) return null;

  const storeSection = page.sections.find((s) =>
    /concept store/i.test(s.heading)
  );
  const replySection = page.sections.find((s) => s.bullets?.length);

  return (
    <article className="contacts-page">
      <header className="contacts-head">
        <h1 className="contacts-title">{page.title}</h1>
        {page.intro && <p className="contacts-lead">{page.intro}</p>}
      </header>

      <div className="contacts-grid">
        <div className="contacts-copy">
          {storeSection && (
            <section className="contacts-block">
              <h2>{storeSection.heading}</h2>
              <address className="contacts-address">
                {SITE_ADDRESS_LINES.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              <ul className="contacts-meta">
                <li>
                  <span>
                    {lang === "uk" ? "Телефон" : "Phone"}
                  </span>
                  <a href={`tel:${SITE_PHONE}`}>{SITE_PHONE_DISPLAY}</a>
                </li>
                <li>
                  <span>Email</span>
                  <a href={`mailto:${SITE_EMAIL}`}>{SITE_EMAIL}</a>
                </li>
                <li>
                  <span>Instagram</span>
                  <a
                    href={SITE_INSTAGRAM}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @_logic_clothes
                  </a>
                </li>
              </ul>
            </section>
          )}

          {replySection && (
            <section className="contacts-block">
              <h2>{replySection.heading}</h2>
              <ul className="contacts-list">
                {replySection.bullets?.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="contacts-map">
          <iframe
            title={
              lang === "uk"
                ? "Карта — Logic Clothes Concept store"
                : "Map — Logic Clothes Concept store"
            }
            src={SITE_MAP_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            className="contacts-map-link"
            href={SITE_MAP_LINK}
            target="_blank"
            rel="noopener noreferrer"
          >
            {lang === "uk" ? "Відкрити в Google Maps" : "Open in Google Maps"}
          </a>
        </div>
      </div>
    </article>
  );
}
