"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
  type PaletteGroup,
} from "@/lib/colorPalette";
import { paintSwatchShape } from "@/lib/paletteSwatchShape";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product, ProductColorVariant } from "@/lib/types";

function dabStyle(hex: string, index: number): CSSProperties {
  const shape = paintSwatchShape(index);
  const isMulti = hex.toUpperCase() === "#FFFFFF" && index % 9 === 8;
  return {
    background: isMulti
      ? "conic-gradient(from 120deg, #c4c4c4, #8a8a8a, #d4c4a8, #e07b39, #8a8a8a, #c4c4c4)"
      : hex,
    borderRadius: shape.borderRadius,
    transform: shape.transform,
  };
}

function PaletteFace({
  group,
  shapeOffset,
}: {
  group: PaletteGroup;
  shapeOffset: number;
}) {
  return (
    <span className="pdp-palette-card-grid" aria-hidden>
      {group.shades.slice(0, 9).map((shade, i) => (
        <span
          key={shade.id}
          className="pdp-palette-card-dab"
          style={dabStyle(shade.hex, shapeOffset + i)}
        />
      ))}
    </span>
  );
}

export default function ProductColorPalette({
  product,
  lang,
}: {
  product: Product;
  lang: Locale;
}) {
  const { t } = useI18n();
  const groups = getPaletteGroups();

  const byGroup = useMemo(() => {
    const map = new Map<string, ProductColorVariant>();
    const members: ProductColorVariant[] = [
      {
        id: product.id,
        name: product.name,
        color: product.color,
        image: product.images[0] || "",
        hex: product.colorHex,
        paletteId: resolvePaletteId({
          color: product.color,
          colorHex: product.colorHex,
        }),
      },
      ...((product.colorVariants ?? []) as ProductColorVariant[]),
    ];
    for (const member of members) {
      const paletteId =
        member.paletteId ||
        resolvePaletteId({ color: member.color, colorHex: member.hex });
      const group = groupForPaletteId(paletteId);
      if (!group) continue;
      const prev = map.get(group.id);
      if (!prev || member.id === product.id) map.set(group.id, member);
    }
    return map;
  }, [product]);

  const currentGroup = useMemo(() => {
    const id = resolvePaletteId({
      color: product.color,
      colorHex: product.colorHex,
    });
    return groupForPaletteId(id);
  }, [product.color, product.colorHex]);

  const colorName = (product.color || "").trim();
  const groupLabel = currentGroup
    ? lang === "en"
      ? currentGroup.labelEn
      : currentGroup.label
    : colorName;
  const hasInactive = groups.some((g) => !byGroup.has(g.id));

  return (
    <div className="pdp-palette-block">
      {groupLabel ? (
        <p className="pdp-color-caption">
          {groupLabel}
          {colorName && currentGroup ? ` · ${colorName}` : null}
        </p>
      ) : null}
      <div
        className="pdp-palette-row pdp-palette-row--cards"
        role="listbox"
        aria-label={t.product.color}
      >
        {groups.map((group, index) => {
          const member = byGroup.get(group.id) ?? null;
          const active = Boolean(member);
          const isCurrent = member?.id === product.id;
          const label = lang === "en" ? group.labelEn : group.label;
          const face = (
            <PaletteFace group={group} shapeOffset={index * 9} />
          );

          if (member && !isCurrent) {
            return (
              <Link
                key={group.id}
                href={`/${lang}/product/${encodeURIComponent(member.id)}`}
                className="pdp-palette-item pdp-palette-item--card is-on"
                title={label}
                aria-label={label}
              >
                {face}
                <span className="pdp-palette-name">{label}</span>
              </Link>
            );
          }

          return (
            <span
              key={group.id}
              className={`pdp-palette-item pdp-palette-item--card${
                isCurrent ? " is-on is-current" : active ? " is-on" : " is-off"
              }`}
              title={label}
              aria-disabled={!active}
              aria-current={isCurrent ? "true" : undefined}
            >
              {face}
              <span className="pdp-palette-name">{label}</span>
            </span>
          );
        })}
      </div>
      {hasInactive ? (
        <ProductDiscussOrder
          lang={lang}
          productId={product.id}
          productName={product.name}
          shadeLabel={groupLabel || colorName}
          label={t.product.sewMyColor}
          intent="color"
        />
      ) : null}
    </div>
  );
}
