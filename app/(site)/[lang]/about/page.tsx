import type { Metadata } from "next";
import AboutContent from "@/components/content/AboutContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { aboutContent } from "@/lib/content/about";
import { getMessages } from "@/lib/i18n/messages";
import { getSiteUrl, pageAlternates, parseLangParam } from "@/lib/i18n/seo";
import {
  generateAboutPageStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = parseLangParam((await params).lang);
  const c = aboutContent[lang];
  return {
    title: c.title,
    description: c.lead,
    alternates: pageAlternates(lang, "about"),
    openGraph: {
      title: `${c.title} | Logic Clothes`,
      description: c.lead,
      url: `${getSiteUrl()}/${lang}/about`,
      type: "website",
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = parseLangParam((await params).lang);
  const c = aboutContent[lang];
  const t = getMessages(lang);
  const baseUrl = getSiteUrl();

  return (
    <PageShell kind="catalog">
      <JsonLd
        data={generateAboutPageStructuredData(lang, c.title, c.lead, baseUrl)}
      />
      <JsonLd
        data={generateBreadcrumbStructuredData(
          [
            { name: t.product.home, url: `/${lang}` },
            { name: c.title, url: `/${lang}/about` },
          ],
          baseUrl
        )}
      />
      <AboutContent lang={lang} />
    </PageShell>
  );
}
