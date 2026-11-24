import type { Metadata } from "next";
import CustomOrderContent from "@/components/content/CustomOrderContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { getMessages } from "@/lib/i18n/messages";
import { getSiteUrl, pageAlternates, parseLangParam } from "@/lib/i18n/seo";
import {
  generateAboutPageStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/seo";
import { getCustomOrderPage } from "@/lib/sitePages";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = parseLangParam((await params).lang);
  const c = await getCustomOrderPage(lang);
  return {
    title: c.title,
    description: c.lead,
    alternates: pageAlternates(lang, "custom-order"),
    openGraph: {
      title: `${c.title} | Logic Clothes`,
      description: c.lead,
      url: `${getSiteUrl()}/${lang}/custom-order`,
      type: "website",
    },
  };
}

export default async function CustomOrderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = parseLangParam((await params).lang);
  const c = await getCustomOrderPage(lang);
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
            { name: c.title, url: `/${lang}/custom-order` },
          ],
          baseUrl
        )}
      />
      <CustomOrderContent lang={lang} />
    </PageShell>
  );
}
