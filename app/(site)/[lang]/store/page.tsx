import type { Metadata } from "next";
import StoreContent from "@/components/content/StoreContent";
import JsonLd from "@/components/shared/JsonLd";
import PageShell from "@/components/shared/PageShell";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getSiteUrl, pageAlternates, parseLangParam } from "@/lib/i18n/seo";
import { generateBreadcrumbStructuredData } from "@/lib/seo";

export const revalidate = 300;

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const t = getMessages(lang);
  return {
    title: t.product.storePhotosTitle,
    description:
      lang === "uk"
        ? "Concept store Logic Clothes у Києві — адреса, карта та фото."
        : "Logic Clothes concept store in Kyiv — address, map and photos.",
    alternates: pageAlternates(lang, "store"),
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  const lang = parseLangParam(raw);
  const t = getMessages(lang);
  const baseUrl = getSiteUrl();

  return (
    <PageShell kind="catalog">
      <JsonLd
        data={generateBreadcrumbStructuredData(
          [
            { name: t.product.home, url: `/${lang}` },
            { name: t.product.storePhotosTitle, url: `/${lang}/store` },
          ],
          baseUrl
        )}
      />
      <StoreContent lang={lang} />
    </PageShell>
  );
}