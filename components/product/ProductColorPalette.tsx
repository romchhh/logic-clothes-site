"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  buildFamilyPaletteSlots,
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
  type PaletteGroup,
  type PaletteSlot,
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

function shadeStyle(hex: string, index: number): CSSProperties {
  const shape = paintSwatchShape(index);
  return {
    backgroundColor: hex,
    borderRadius: shape.borderRadius,
    transform: shape.transform,
  };
}

function targetProductId(slots: PaletteSlot[], currentId: string): string | null {
  const other = slots.find((s) => s.variant && s.variant.id !== currentId);
  return other?.variant?.id ?? slots[0]?.variant?.id ?? null;
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
    [product]
  );

  const slotsByGroup = useMemo(() => {
    const map = new Map<string, PaletteSlot[]>();
    for (const slot of slots) {
      const group = groupForPaletteId(slot.palette.id);
      if (!group) continue;
      const list = map.get(group.id) ?? [];
      list.push(slot);
      map.set(group.id, list);
    }
    return map;
  }, [slots]);

  const currentGroup = useMemo(() => {
    const id = resolvePaletteId({
      color: product.color,
      colorHex: product.colorHex,
    });
    return groupForPaletteId(id);
  }, [product.color, product.colorHex]);

  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(
    currentGroup?.id ?? null
  );

  useEffect(() => {
    setExpandedGroupId(currentGroup?.id ?? null);
  }, [product.id, currentGroup?.id]);

  const activeGroupId = expandedGroupId ?? currentGroup?.id ?? null;
  const activeGroupSlots = activeGroupId
    ? slotsByGroup.get(activeGroupId) ?? []
    : [];

  const colorName = (product.color || "").trim();
  const groupLabel = currentGroup
    ? lang === "en"
      ? currentGroup.labelEn
      : currentGroup.label
    : colorName;
  const hasInactive = groups.some((g) => !slotsByGroup.has(g.id));

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
          const groupSlots = slotsByGroup.get(group.id) ?? [];
          const available = groupSlots.length > 0;
          const isCurrentGroup = currentGroup?.id === group.id;
          const isExpanded = activeGroupId === group.id;
          const label = lang === "en" ? group.labelEn : group.label;
          const face = <PaletteFace group={group} shapeOffset={index * 9} />;
          const otherId = available
            ? targetProductId(groupSlots, product.id)
            : null;
          // Other family → navigate to that colourway. Current family → expand shades.
          const goesElsewhere = Boolean(
            !isCurrentGroup && otherId && otherId !== product.id
          );

          if (goesElsewhere && otherId) {
            return (
              <Link
                key={group.id}
                href={`/${lang}/product/${encodeURIComponent(otherId)}`}
                className={`pdp-palette-item pdp-palette-item--card is-on${
                  isExpanded ? " is-current" : ""
                }`}
                title={label}
                aria-label={label}
              >
                {face}
                <span className="pdp-palette-name">{label}</span>
              </Link>
            );
          }

          if (available) {
            return (
              <button
                type="button"
                key={group.id}
                className={`pdp-palette-item pdp-palette-item--card is-on${
                  isCurrentGroup || isExpanded ? " is-current" : ""
                }`}
                title={label}
                aria-label={label}
                aria-pressed={isExpanded}
                onClick={() => setExpandedGroupId(group.id)}
              >
                {face}
                <span className="pdp-palette-name">{label}</span>
              </button>
            );
          }

          return (
            <span
              key={group.id}
              className="pdp-palette-item pdp-palette-item--card is-off"
              title={label}
              aria-disabled="true"
            >
              {face}
              <span className="pdp-palette-name">{label}</span>
            </span>
          );
        })}
      </div>

      {activeGroupSlots.length > 1 ? (
        <div
          className="pdp-palette-shades"
          role="listbox"
          aria-label={
            lang === "en" ? "Shades in this palette" : "Відтінки цієї палітри"
          }
        >
          {activeGroupSlots.map((slot, i) => {
            const label =
              lang === "en" ? slot.palette.labelEn : slot.palette.label;
            const isCurrent =
              slot.isCurrent ||
              (slot.variant?.id === product.id &&
                slot.palette.id ===
                  resolvePaletteId({
                    color: product.color,
                    colorHex: product.colorHex,
                  }));
            const href =
              slot.variant && slot.variant.id !== product.id
                ? `/${lang}/product/${encodeURIComponent(slot.variant.id)}`
                : null;
            const face = (
              <span
                className="pdp-palette-shade-swatch"
                style={shadeStyle(slot.palette.hex, i)}
                aria-hidden
              />
            );

            if (href) {
              return (
                <Link
                  key={slot.palette.id}
                  href={href}
                  className={`pdp-palette-shade${isCurrent ? " is-current" : ""}`}
                  title={label}
                  aria-label={label}
                >
                  {face}
                  <span className="pdp-palette-shade-name">{label}</span>
                </Link>
              );
            }

            return (
              <span
                key={slot.palette.id}
                className={`pdp-palette-shade${isCurrent ? " is-current" : ""}`}
                title={label}
                aria-current={isCurrent ? "true" : undefined}
              >
                {face}
                <span className="pdp-palette-shade-name">{label}</span>
              </span>
            );
          })}
        </div>
      ) : null}

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
