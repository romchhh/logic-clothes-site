"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import {
  buildFamilyPaletteSlots,
  type PaletteColor,
} from "@/lib/colorPalette";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import ProductCustomOrderBlock from "@/components/product/ProductCustomOrderBlock";
import type { Product, ProductColorVariant } from "@/lib/types";

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
}

function swatchStyle(palette: PaletteColor): CSSProperties {
  if (palette.id === "multi") {
    return {
      background:
        "conic-gradient(from 90deg, #c4c4c4, #8a8a8a, #d4c4a8, #a67b5b, #8a8a8a)",
    };
  }
  return {
    backgroundColor: palette.hex,
    boxShadow: isLightHex(palette.hex)
      ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
      : "inset 0 0 0 1px rgba(0,0,0,0.06)",
  };
}

export default function ProductColorPalette({
  product,
  lang,
}: {
  product: Product;
  lang: Locale;
}) {
  const { t } = useI18n();
  const slots = useMemo(
    () =>
      buildFamilyPaletteSlots(
        {
          id: product.id,
          name: product.name,
          color: product.color,
          colorHex: product.colorHex,
          images: product.images,
          swatches: product.swatches,
        },
        (product.colorVariants ?? []) as ProductColorVariant[]
      ),
    [
      product.id,
      product.name,
      product.color,
      product.colorHex,
      product.images,
      product.swatches,
      product.colorVariants,
    ]
  );

  const currentSlot = slots.find((s) => s.isCurrent) ?? slots[0];
  const activeLabel = currentSlot
    ? lang === "en"
      ? currentSlot.palette.labelEn
      : currentSlot.palette.label
    : product.color?.trim() || "";

  const showSwatches =
    slots.length > 0 &&
    (slots.length > 1 || Boolean(product.color || product.colorHex));

  return (
    <div className="pdp-option pdp-option--color pdp-option--color-unified">
      {showSwatches ? (
        <>
          <div className="pdp-option-top">
            <p className="pdp-label">{t.product.color}</p>
            {activeLabel ? (
              <p className="pdp-option-value">{activeLabel}</p>
            ) : null}
          </div>
          <div
            className="pdp-swatches pdp-swatches--palette"
            role="listbox"
            aria-label={t.product.color}
          >
            {slots.map(({ palette, variant, isCurrent }) => {
          const label = lang === "en" ? palette.labelEn : palette.label;
          const className = [
            "pdp-swatch",
            isCurrent ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const face = (
            <span className="pdp-swatch-face" style={swatchStyle(palette)} />
          );

          if (variant && !isCurrent) {
            return (
              <Link
                key={palette.id}
                href={`/${lang}/product/${encodeURIComponent(variant.id)}`}
                className={className}
                role="option"
                aria-label={label}
                aria-selected={false}
                title={label}
              >
                {face}
              </Link>
            );
          }

          return (
            <span
              key={palette.id}
              className={className}
              role="option"
              aria-label={label}
              aria-selected={isCurrent}
              title={label}
            >
              {face}
            </span>
          );
            })}
          </div>
        </>
      ) : (
        <div className="pdp-option-top">
          <p className="pdp-label">{t.product.color}</p>
        </div>
      )}

      <ProductCustomOrderBlock product={product} lang={lang} embedded />
    </div>
  );
}
