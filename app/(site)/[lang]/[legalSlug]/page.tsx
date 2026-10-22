import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactsContent from "@/components/content/ContactsContent";
import LegalContent from "@/components/content/LegalContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { getLegalPage, getLegalSlugs } from "@/lib/content/legal";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getSiteUrl, pageAlternates, parseLangParam } from "@/lib/i18n/seo";
import { generateBreadcrumbStructuredData } from "@/lib/seo";
import {
  SITE_EMAIL,
  SITE_NAME,
  SITE_PHONE,
} from "@/lib/siteContact";

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
  if (!page) return { title: "Not found", robots: { index: false } };
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

  const t = getMessages(lang);
  const baseUrl = getSiteUrl();
  const url = `${baseUrl}/${lang}/${legalSlug}`;

  const contactSchema =
    legalSlug === "contacts"
      ? {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "@id": `${url}#contact`,
          name: page.title,
          description: page.intro,
          url,
          isPartOf: { "@id": `${baseUrl}/#website` },
          mainEntity: {
            "@type": "Organization",
            name: SITE_NAME,
            email: SITE_EMAIL,
            telephone: SITE_PHONE,
            url: baseUrl,
          },
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          name: page.title,
          description: page.intro,
          url,
          isPartOf: { "@id": `${baseUrl}/#website` },
          dateModified: page.updated,
        };

  return (
    <PageShell kind="catalog">
      <JsonLd data={contactSchema} />
      <JsonLd
        data={generateBreadcrumbStructuredData(
          [
            { name: t.product.home, url: `/${lang}` },
            { name: page.title, url: `/${lang}/${legalSlug}` },
          ],
          baseUrl
        )}
      />
      {legalSlug === "contacts" ? (
        <ContactsContent lang={lang} />
      ) : (
        <LegalContent page={page} />
      )}
    </PageShell>
  );
}
