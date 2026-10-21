"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import {
  buildPaletteSlots,
  type PaletteColor,
} from "@/lib/colorPalette";
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
      buildPaletteSlots(
        {
          id: product.id,
          name: product.name,
          color: product.color,
          colorHex: product.colorHex,
          images: product.images,
        },
        (product.colorVariants ?? []) as ProductColorVariant[]
      ),
    [
      product.id,
      product.name,
      product.color,
      product.colorHex,
      product.images,
      product.colorVariants,
    ]
  );

  const currentSlot = slots.find((s) => s.isCurrent);
  const [focusId, setFocusId] = useState<string | null>(null);

  const focusSlot = focusId
    ? slots.find((s) => s.palette.id === focusId)
    : null;
  const showSew =
    focusSlot != null && !focusSlot.variant && !focusSlot.isCurrent;

  const activeLabel = showSew
    ? lang === "en"
      ? focusSlot!.palette.labelEn
      : focusSlot!.palette.label
    : currentSlot
      ? lang === "en"
        ? currentSlot.palette.labelEn
        : currentSlot.palette.label
      : product.color || null;

  return (
    <div className="pdp-option pdp-option--color">
      <div className="pdp-option-top">
        <p className="pdp-label">{t.product.color}</p>
        {activeLabel && <p className="pdp-option-value">{activeLabel}</p>}
      </div>
      <div
        className="pdp-swatches pdp-swatches--palette"
        role="listbox"
        aria-label={t.product.color}
      >
          {slots.map(({ palette, variant, isCurrent }) => {
            const label = lang === "en" ? palette.labelEn : palette.label;
            const focused = focusId === palette.id;
            const className = [
              "pdp-swatch",
              isCurrent ? "is-active" : "",
              focused && !isCurrent ? "is-focus" : "",
              !variant && !isCurrent ? "is-made-to-order" : "",
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
                  onClick={() => setFocusId(null)}
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
                aria-label={label}
                aria-selected={isCurrent || focused}
                title={
                  isCurrent ? label : `${label} — ${t.product.sewForYou}`
                }
                onClick={() => {
                  if (isCurrent) {
                    setFocusId(null);
                    return;
                  }
                  setFocusId(palette.id);
                }}
              >
                {face}
              </button>
            );
          })}
      </div>
      {showSew && (
        <p className="pdp-option-note" role="status">
          {t.product.sewForYou}
        </p>
      )}
    </div>
  );
}
