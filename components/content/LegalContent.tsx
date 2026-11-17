import ContentGallery from "@/components/content/ContentGallery";
import ContentPage from "@/components/shared/ContentPage";
import MarkdownBody from "@/components/shared/MarkdownBody";
import { legalToMarkdown } from "@/lib/content/markdownDefaults";
import type { LegalPage } from "@/lib/content/legal";
import type { Locale } from "@/lib/i18n/config";

export default function LegalContent({
  page,
  lang = "uk",
}: {
  page: LegalPage;
  lang?: Locale;
}) {
  const markdown = legalToMarkdown(page);
  const hero = page.heroImage?.trim() || "";

  return (
    <>
      {hero ? (
        <div className="about-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt="" aria-hidden="true" />
        </div>
      ) : null}

      <ContentPage title={page.title} eyebrow={page.updated || undefined}>
        <MarkdownBody markdown={markdown} />
        <ContentGallery images={page.gallery || []} lang={lang} />
      </ContentPage>
    </>
  );
}
