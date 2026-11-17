import type { ContentGalleryImage } from "@/lib/sitePagesTypes";
import type { Locale } from "@/lib/i18n/config";

export default function ContentGallery({
  images,
  lang,
}: {
  images: ContentGalleryImage[];
  lang: Locale;
}) {
  if (!images?.length) return null;

  return (
    <div className="content-gallery" aria-label={lang === "en" ? "Photos" : "Фото"}>
      {images.map((img, i) => (
        <figure key={`${img.src}-${i}`} className="content-gallery-item">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.src}
            alt={
              lang === "en"
                ? img.altEn || img.altUk || ""
                : img.altUk || img.altEn || ""
            }
          />
          {(lang === "en" ? img.altEn || img.altUk : img.altUk || img.altEn) ? (
            <figcaption>
              {lang === "en" ? img.altEn || img.altUk : img.altUk || img.altEn}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
