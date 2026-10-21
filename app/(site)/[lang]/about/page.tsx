import type { Metadata } from "next";
import AboutContent from "@/components/content/AboutContent";
import PageShell from "@/components/shared/PageShell";
import { aboutContent } from "@/lib/content/about";
import { pageAlternates, parseLangParam } from "@/lib/i18n/seo";

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
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = parseLangParam((await params).lang);

  return (
    <PageShell kind="catalog">
      <AboutContent lang={lang} />
    </PageShell>
  );
}
