import ContentGallery from "@/components/content/ContentGallery";
import ContentPage from "@/components/shared/ContentPage";
import MarkdownBody from "@/components/shared/MarkdownBody";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getStorePage } from "@/lib/sitePages";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_MAP_EMBED,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";

export default async function StoreContent({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const c = await getStorePage(lang);
  const hero = c.heroImage || "/assets/footer-bg.png";
  const title = c.title || t.product.storePhotosTitle;

  return (
    <>
      {hero ? (
        <div className="about-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt="" aria-hidden="true" />
        </div>
      ) : null}

      <ContentPage title={title}>
        <MarkdownBody markdown={c.bodyMarkdown || ""} />
        <ContentGallery images={c.gallery || []} lang={lang} />

        <StoreContactsFooter lang={lang} />
      </ContentPage>
    </>
  );
}

function StoreContactsFooter({ lang }: { lang: Locale }) {
  return (
    <div className="contacts-grid store-page-grid mt-10 border-t border-black/10 pt-10 dark:border-white/10">
      <div className="contacts-copy">
        <section className="contacts-block">
          <h2>Concept store</h2>
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
          <p className="store-page-more">
            <a href={`/${lang}/contacts`}>
              {lang === "uk" ? "Усі контакти" : "All contacts"}
            </a>
          </p>
        </section>
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
  );
}