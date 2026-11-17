import ContentGallery from "@/components/content/ContentGallery";
import MarkdownBody from "@/components/shared/MarkdownBody";
import { legalToMarkdown } from "@/lib/content/markdownDefaults";
import type { Locale } from "@/lib/i18n/config";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_MAP_EMBED,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";
import { getLegalPageContent } from "@/lib/sitePages";

export default async function ContactsContent({ lang }: { lang: Locale }) {
  const page = await getLegalPageContent(lang, "contacts");
  if (!page) return null;

  const markdown = legalToMarkdown(page);
  const hero = page.heroImage?.trim() || "";

  return (
    <article className="contacts-page">
      {hero ? (
        <div className="about-hero" style={{ paddingBottom: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt="" aria-hidden="true" />
        </div>
      ) : null}

      <header className="contacts-head">
        <h1 className="contacts-title">{page.title}</h1>
        {page.updated ? (
          <p className="content-page-eyebrow">{page.updated}</p>
        ) : null}
      </header>

      <div className="contacts-grid">
        <div className="contacts-copy">
          {markdown.trim() ? (
            <section className="contacts-block">
              <MarkdownBody markdown={markdown} />
            </section>
          ) : null}

          <section className="contacts-block">
            <h2>{lang === "uk" ? "Concept store" : "Concept store"}</h2>
            <address className="contacts-address">
              {SITE_ADDRESS_LINES.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
            <ul className="contacts-meta">
              <li>
                <span>{lang === "uk" ? "Телефон" : "Phone"}</span>
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

          <ContentGallery images={page.gallery || []} lang={lang} />
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
