import ProductRail from "@/components/main-page/ProductRail";
import type { Locale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { getHomeProductRails } from "@/lib/products";

export default async function FeaturedServer({ lang }: { lang: Locale }) {
  const rails = await getHomeProductRails(14);
  const t = getMessages(lang);

  return (
    <div className="home-rails">
      <ProductRail
        title={t.home.featured}
        titleId="home-featured-title"
        products={rails.popular}
        lang={lang}
        seeAllHref={`/${lang}/catalog`}
        priorityCount={3}
      />
      <ProductRail
        title={t.home.newcomers}
        titleId="home-newcomers-title"
        products={rails.newcomers}
        lang={lang}
        seeAllHref={`/${lang}/catalog?category=new`}
      />
      <ProductRail
        title={t.home.sale}
        titleId="home-sale-title"
        products={rails.sale}
        lang={lang}
        seeAllHref={`/${lang}/catalog?category=sale`}
      />
    </div>
  );
}
