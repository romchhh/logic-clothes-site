import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactsContent from "@/components/content/ContactsContent";
import LegalContent from "@/components/content/LegalContent";
import PageShell from "@/components/shared/PageShell";
import { getLegalPage, getLegalSlugs } from "@/lib/content/legal";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { pageAlternates, parseLangParam } from "@/lib/i18n/seo";

export const revalidate = 300;

export function generateStaticParams() {
  const slugs = getLegalSlugs();
  return SUPPORTED_LOCALES.flatMap((lang) =>
    slugs.map((legalSlug) => ({ lang, legalSlug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; legalSlug: string }>;
}): Promise<Metadata> {
  const { lang: raw, legalSlug } = await params;
  const lang = parseLangParam(raw);
  const page = getLegalPage(lang, legalSlug);
  if (!page) return { title: "Not found" };
  return {
    title: page.title,
    description: page.intro,
    alternates: pageAlternates(lang, legalSlug),
  };
}

export default async function LegalSlugPage({
  params,
}: {
  params: Promise<{ lang: string; legalSlug: string }>;
}) {
  const { lang: raw, legalSlug } = await params;
  const lang = parseLangParam(raw);
  const page = getLegalPage(lang, legalSlug);
  if (!page) notFound();

  return (
    <PageShell kind="catalog">
      {legalSlug === "contacts" ? (
        <ContactsContent lang={lang} />
      ) : (
        <LegalContent page={page} />
      )}
    </PageShell>
  );
}
