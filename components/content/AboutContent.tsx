import ContentGallery from "@/components/content/ContentGallery";
import ContentPage from "@/components/shared/ContentPage";
import MarkdownBody from "@/components/shared/MarkdownBody";
import { aboutToMarkdown } from "@/lib/content/markdownDefaults";
import type { Locale } from "@/lib/i18n/config";
import { getAboutPage } from "@/lib/sitePages";

export default async function AboutContent({ lang }: { lang: Locale }) {
  const c = await getAboutPage(lang);
  const markdown = aboutToMarkdown(c);
  const hero = c.heroImage || "/assets/footer-bg.png";

  return (
    <>
      {hero ? (
        <div className="about-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt="" aria-hidden="true" />
        </div>
      ) : null}

      <ContentPage title={c.title}>
        <MarkdownBody markdown={markdown} />
        <ContentGallery images={c.gallery || []} lang={lang} />
      </ContentPage>
    </>
  );
}
