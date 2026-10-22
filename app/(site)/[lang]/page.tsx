import { Suspense } from "react";
import type { Metadata } from "next";
import About from "@/components/main-page/About";
import FeaturedServer from "@/components/main-page/FeaturedServer";
import Hero from "@/components/main-page/Hero";
import PageShell from "@/components/shared/PageShell";
import { getCategories } from "@/lib/categories";
import { getHeroContent } from "@/lib/hero";
import { parseLangParam, pageAlternates, seoCopy } from "@/lib/i18n/seo";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const copy = seoCopy[lang];
  return {
    title: copy.siteTitle,
    description: copy.homeDescription,
    keywords: copy.homeKeywords,
    alternates: pageAlternates(lang),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const [categories, hero] = await Promise.all([
    getCategories(),
    getHeroContent(),
  ]);

  return (
    <PageShell kind="home">
      <div className="home-shell">
        <Hero lang={lang} categories={categories} content={hero} />
        <Suspense fallback={<div className="home-section" />}>
          <FeaturedServer lang={lang} />
        </Suspense>
        <About lang={lang} />
      </div>
    </PageShell>
  );
}
