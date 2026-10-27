"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import GroupedPaletteBoard from "@/components/palette/GroupedPaletteBoard";
import {
  COLOR_PALETTE,
  resolvePaletteId,
  type PaletteColor,
} from "@/lib/colorPalette";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

export default function ProductCustomOrderBlock({
  product,
  lang,
  embedded = false,
}: {
  product: Product;
  lang: Locale;
  /** Inside PDP «Колір» block — no duplicate page section */
  embedded?: boolean;
}) {
  const { t } = useI18n();
  const productPaletteId = resolvePaletteId({
    color: product.color,
    colorHex: product.colorHex,
  });

  const [selectedId, setSelectedId] = useState<string | null>(productPaletteId);

  useEffect(() => {
    setSelectedId(productPaletteId);
  }, [product.id, productPaletteId]);

  const selectedColor = useMemo(
    () => COLOR_PALETTE.find((c) => c.id === selectedId) ?? null,
    [selectedId]
  );

  const selectedLabel = selectedColor
    ? lang === "en"
      ? selectedColor.labelEn
      : selectedColor.label
    : null;

  const contactHref = useMemo(() => {
    const base = `/${lang}/contacts`;
    if (!selectedLabel) return base;
    const params = new URLSearchParams({
      model: product.id,
      shade: selectedLabel,
    });
    return `${base}?${params.toString()}`;
  }, [lang, product.id, selectedLabel]);

  function onPick(color: PaletteColor) {
    setSelectedId(color.id);
  }

  const Wrapper = embedded ? "div" : "section";
  const titleId = embedded ? "pdp-color-custom-title" : "pdp-custom-order-title";
  const headClass = embedded
    ? "pdp-color-custom-head"
    : "pdp-custom-order-head";
  const titleClass = embedded
    ? "pdp-color-custom-title"
    : "pdp-custom-order-title";
  const rootClass = embedded ? "pdp-color-custom" : "pdp-custom-order";

  return (
    <Wrapper
      className={rootClass}
      aria-labelledby={titleId}
    >
      <header className={headClass}>
        {embedded ? (
          <h3 id={titleId} className={titleClass}>
            {t.product.customOrderTitle}
          </h3>
        ) : (
          <h2 id={titleId} className={titleClass}>
            {t.product.customOrderTitle}
          </h2>
        )}
        <p className="pdp-custom-order-lead">{t.product.customOrderLead}</p>
      </header>
      <GroupedPaletteBoard
        lang={lang}
        mode="pick"
        activeId={selectedId}
        onPick={onPick}
        className="pdp-custom-order-board"
      />
      {selectedLabel && (
        <p className="pdp-custom-order-selected" aria-live="polite">
          {t.product.customOrderSelected}:{" "}
          <strong>{selectedLabel}</strong>
        </p>
      )}
      <Link href={contactHref} className="pdp-custom-order-cta">
        {t.product.customOrderCta}
      </Link>
    </Wrapper>
  );
}
