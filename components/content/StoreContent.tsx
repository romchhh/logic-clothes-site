import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  SITE_ADDRESS_LINES,
  SITE_EMAIL,
  SITE_INSTAGRAM,
  SITE_MAP_EMBED,
  SITE_MAP_LINK,
  SITE_PHONE,
  SITE_PHONE_DISPLAY,
} from "@/lib/siteContact";
import { getStorePhotos, type StorePhoto } from "@/lib/storePhotos";

export default async function StoreContent({ lang }: { lang: Locale }) {
  const t = getMessages(lang);
  const photos: StorePhoto[] = await getStorePhotos();

  return (
    <article className="contacts-page store-page">
      <header className="contacts-head">
        <h1 className="contacts-title">{t.product.storePhotosTitle}</h1>
        <p className="content-page-eyebrow">
          {lang === "uk" ? "Concept store · Київ" : "Concept store · Kyiv"}
        </p>
      </header>

      {photos.length > 0 ? (
        <section className="store-page-gallery" aria-label={t.product.storePhotosTitle}>
          <div className="pdp-store-photos-track store-page-track">
            {photos.map((photo, i) => {
              const caption =
                lang === "en"
                  ? photo.altEn || photo.altUk
                  : photo.altUk || photo.altEn;
              return (
                <figure
                  key={`${photo.src}-${i}`}
                  className="pdp-store-photo store-page-photo"
                >
                  <div className="pdp-store-photo-media">
                    <Image
                      src={photo.src}
                      alt={caption || t.product.storePhotosTitle}
                      fill
                      sizes="(max-width: 899px) 70vw, 32vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  {caption ? (
                    <figcaption className="pdp-store-photo-caption">
                      {caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="contacts-grid store-page-grid">
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
    </article>
  );
}