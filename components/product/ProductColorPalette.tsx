"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import GroupedPaletteBoard from "@/components/palette/GroupedPaletteBoard";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  buildFamilyPaletteSlots,
  COLOR_PALETTE,
  resolvePaletteId,
  type PaletteColor,
} from "@/lib/colorPalette";
import { paintSwatchShape } from "@/lib/paletteSwatchShape";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product, ProductColorVariant } from "@/lib/types";

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
}

function swatchStyle(
  palette: PaletteColor,
  shapeIndex: number
): CSSProperties {
  const shape = paintSwatchShape(shapeIndex);
  if (palette.id === "multi") {
    return {
      background:
        "conic-gradient(from 90deg, #c4c4c4, #8a8a8a, #d4c4a8, #a67b5b, #8a8a8a)",
      borderRadius: shape.borderRadius,
      transform: shape.transform,
    };
  }
  return {
    backgroundColor: palette.hex,
    borderRadius: shape.borderRadius,
    transform: shape.transform,
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

  const productPaletteId = useMemo(
    () =>
      resolvePaletteId({
        color: product.color,
        colorHex: product.colorHex,
      }),
    [product.color, product.colorHex]
  );

  const [pickedId, setPickedId] = useState<string | null>(productPaletteId);

  useEffect(() => {
    setPickedId(productPaletteId);
  }, [product.id, productPaletteId]);

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

  const fallbackLabel =
    product.color?.trim() ||
    (lang === "en"
      ? slots[0]?.palette.labelEn
      : slots[0]?.palette.label) ||
    "";

  const pickedColor = useMemo(
    () => COLOR_PALETTE.find((c) => c.id === pickedId) ?? null,
    [pickedId]
  );

  const displayLabel = pickedColor
    ? lang === "en"
      ? pickedColor.labelEn
      : pickedColor.label
    : fallbackLabel;

  const showFamilyRow = slots.length > 1;

  function onPick(color: PaletteColor) {
    setPickedId(color.id);
  }

  return (
    <div className="pdp-option pdp-option--color pdp-option--color-unified">
      <div className="pdp-option-top">
        <p className="pdp-label">{t.product.color}</p>
        {displayLabel ? (
          <p className="pdp-option-value" aria-live="polite">
            {displayLabel}
          </p>
        ) : null}
      </div>

      {showFamilyRow ? (
        <div
          className="pdp-color-family"
          role="listbox"
          aria-label={t.product.color}
        >
          <p className="pdp-color-family-label">
            {lang === "uk" ? "Інші кольори моделі" : "Other colors"}
          </p>
          <div className="pdp-swatches pdp-swatches--palette">
            {slots.map(({ palette, variant, isCurrent }, slotIdx) => {
              const label =
                lang === "en" ? palette.labelEn : palette.label;
              const className = [
                "pdp-swatch",
                "pdp-swatch--paint",
                isCurrent || pickedId === palette.id ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const face = (
                <span
                  className="pdp-swatch-face"
                  style={swatchStyle(palette, slotIdx)}
                >
                  <span className="pdp-swatch-paint" aria-hidden="true" />
                </span>
              );

              if (variant && !isCurrent) {
                return (
                  <Link
                    key={palette.id}
                    href={`/${lang}/product/${encodeURIComponent(variant.id)}`}
                    className={className}
                    role="option"
                    aria-label={label}
                    title={label}
                  >
                    {face}
                  </Link>
                );
              }

              return (
                <button
                  key={palette.id}
                  type="button"
                  className={className}
                  role="option"
                  aria-selected={pickedId === palette.id}
                  title={label}
                  onClick={() => setPickedId(palette.id)}
                >
                  {face}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <GroupedPaletteBoard
        lang={lang}
        mode="pick"
        activeId={pickedId}
        onPick={onPick}
        className="pdp-color-unified-board"
      />

      <p className="pdp-color-unified-hint">{t.product.customOrderLead}</p>

      <ProductDiscussOrder
        lang={lang}
        productId={product.id}
        productName={product.name}
        shadeLabel={displayLabel}
      />
    </div>
  );
}
