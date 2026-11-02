"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  getPaletteGroups,
  groupForPaletteId,
  paintGroupPreviewHex,
  resolvePaletteId,
} from "@/lib/colorPalette";
import { paintSwatchShape } from "@/lib/paletteSwatchShape";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product, ProductColorVariant } from "@/lib/types";

function paintStyle(hex: string, index: number): CSSProperties {
  const shape = paintSwatchShape(index);
  return {
    backgroundColor: hex,
    borderRadius: shape.borderRadius,
    transform: shape.transform,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
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

  const colorName = (product.color || "").trim();
  const hasInactive = groups.some((g) => !byGroup.has(g.id));

  return (
    <div className="pdp-palette-block">
      {colorName ? <p className="pdp-color-caption">{colorName}</p> : null}
      <div className="pdp-palette-row" role="listbox" aria-label={t.product.color}>
        {groups.map((group, index) => {
          const member = byGroup.get(group.id) ?? null;
          const active = Boolean(member);
          const label = member
            ? member.color || (lang === "en" ? group.labelEn : group.label)
            : lang === "en"
              ? group.labelEn
              : group.label;
          const hex = member?.hex || paintGroupPreviewHex(group);
          const face = (
            <span className="pdp-palette-stroke" style={paintStyle(hex, index)} />
          );
          if (member && member.id !== product.id) {
            return (
              <Link
                key={group.id}
                href={`/${lang}/product/${encodeURIComponent(member.id)}`}
                className="pdp-palette-item is-on"
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
              className={`pdp-palette-item${active ? " is-on is-current" : " is-off"}`}
              title={label}
              aria-disabled={!active}
            >
              {face}
              {active ? <span className="pdp-palette-name">{label}</span> : null}
            </span>
          );
        })}
      </div>
      {hasInactive ? (
        <ProductDiscussOrder
          lang={lang}
          productId={product.id}
          productName={product.name}
          shadeLabel={colorName}
          label={t.product.sewMyColor}
          intent="color"
        />
      ) : null}
    </div>
  );
}
