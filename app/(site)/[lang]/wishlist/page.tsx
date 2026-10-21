import type { Metadata } from "next";
import PageShell from "@/components/shared/PageShell";
import WishlistClient from "@/components/wishlist/WishlistClient";
import { getMessages } from "@/lib/i18n/messages";
import {
  generateLocaleStaticParams,
  pageAlternates,
  parseLangParam,
} from "@/lib/i18n/seo";

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
    title: t.wish.title,
    description: t.wish.lead,
    robots: { index: false, follow: false },
    alternates: pageAlternates(lang, "wishlist"),
  };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = parseLangParam((await params).lang);

  return (
    <PageShell kind="catalog">
      <WishlistClient lang={lang} />
    </PageShell>
  );
}
