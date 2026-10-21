import type { Metadata } from "next";
import FinalCheckout from "@/components/checkout/FinalCheckout";
import PageShell from "@/components/shared/PageShell";
import { getMessages } from "@/lib/i18n/messages";
import {
  generateLocaleStaticParams,
  pageAlternates,
  parseLangParam,
} from "@/lib/i18n/seo";
import { getFeaturedProducts } from "@/lib/products";

export function generateStaticParams() {
  return generateLocaleStaticParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = parseLangParam((await params).lang);
  const t = getMessages(lang);
  return {
    title: t.checkout.title,
    description: t.checkout.subtitle,
    robots: { index: false, follow: false },
    alternates: pageAlternates(lang, "final"),
  };
}

export default async function FinalPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = parseLangParam((await params).lang);
  const suggested = await getFeaturedProducts(8);

  return (
    <PageShell kind="catalog">
      <FinalCheckout lang={lang} suggested={suggested} />
    </PageShell>
  );
}
