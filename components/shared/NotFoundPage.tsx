"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { parseLangParam } from "@/lib/i18n/seo";

export default function NotFoundPage({ lang: langProp }: { lang?: Locale }) {
  const params = useParams();
  const fromRoute = parseLangParam(String(params?.lang || "uk"));
  const lang = langProp ?? fromRoute;
  const { t } = useI18n();

  return (
    <section className="nf-page" aria-labelledby="nf-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brush-art nf-brush nf-brush--mint"
        src="/assets/brush-mint.png"
        alt=""
        aria-hidden="true"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brush-art nf-brush nf-brush--pink"
        src="/assets/brush-pink.png"
        alt=""
        aria-hidden="true"
      />

      <div className="nf-inner">
        <p className="nf-brand">Logic Clothes</p>
        <p className="nf-code" aria-hidden="true">
          {t.notFound.code}
        </p>
        <h1 id="nf-title" className="nf-title">
          {t.notFound.title}
        </h1>
        <p className="nf-lead">{t.notFound.lead}</p>
        <div className="nf-actions">
          <Link href={`/${lang}`} className="nf-btn nf-btn--primary">
            {t.notFound.home}
          </Link>
          <Link href={`/${lang}/catalog`} className="nf-btn nf-btn--ghost">
            {t.notFound.catalog}
          </Link>
          <Link href={`/${lang}/about`} className="nf-btn nf-btn--ghost">
            {t.nav.about}
          </Link>
        </div>
      </div>
    </section>
  );
}
