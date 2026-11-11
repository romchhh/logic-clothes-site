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

type ShadeChoice = {
  id: string;
  label: string;
  hex: string;
  isCurrent: boolean;
  /** Can open this SKU on the storefront */
  linkable: boolean;
};

type GroupChoice = {
  group: PaletteGroup;
  hrefId: string;
  isCurrent: boolean;
  linkable: boolean;
  shades: ShadeChoice[];
};

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

function memberPaletteId(m: {
  color?: string;
  hex?: string;
  paletteId?: string | null;
}): string | null {
  return (
    m.paletteId ||
    resolvePaletteId({ color: m.color, colorHex: m.hex, hex: m.hex })
  );
}

function isLinkableVariant(
  m: ProductColorVariant,
  currentId: string
): boolean {
  if (m.id === currentId) return true;
  return m.isVisible !== false;
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

  const family = useMemo(() => {
    const byId = new Map<string, ProductColorVariant>();
    const self: ProductColorVariant = {
      id: product.id,
      name: product.name,
      color: product.color,
      image: product.images[0] || "",
      hex: product.colorHex,
      isVisible: product.isVisible !== false,
      paletteId: resolvePaletteId({
        color: product.color,
        colorHex: product.colorHex,
      }),
    };
    byId.set(self.id, self);

    for (const v of (product.colorVariants ?? []) as ProductColorVariant[]) {
      if (!v?.id) continue;
      byId.set(v.id, {
        ...v,
        paletteId: memberPaletteId(v),
        isVisible: v.isVisible !== false,
      });
    }

    return [...byId.values()];
  }, [product]);

  const choices = useMemo(() => {
    const byGroup = new Map<string, ShadeChoice[]>();

    for (const m of family) {
      const paletteId = memberPaletteId(m);
      const group = groupForPaletteId(paletteId);
      if (!group || !paletteId) continue;

      const linkable = isLinkableVariant(m, product.id);
      // Hide other drafts from the switcher entirely
      if (!linkable && m.id !== product.id) continue;

      const list = byGroup.get(group.id) ?? [];
      if (!list.some((x) => x.id === m.id)) {
        list.push({
          id: m.id,
          label: m.color || (lang === "en" ? group.labelEn : group.label),
          hex: m.hex || group.shades[0]?.hex || "#ccc",
          isCurrent: m.id === product.id,
          linkable,
        });
      }
      byGroup.set(group.id, list);
    }

    const out: GroupChoice[] = [];
    for (const group of groups) {
      const shades = byGroup.get(group.id);
      if (!shades?.length) continue;
      const current = shades.find((s) => s.isCurrent);
      const target =
        shades.find((s) => s.linkable && !s.isCurrent) ??
        shades.find((s) => s.linkable) ??
        shades[0];
      out.push({
        group,
        hrefId: target.id,
        isCurrent: Boolean(current),
        linkable: Boolean(
          target && target.linkable && target.id !== product.id
        ),
        shades,
      });
    }
    return out;
  }, [family, groups, lang, product.id]);

  const currentChoice = choices.find((c) => c.isCurrent) ?? null;
  const currentGroup = currentChoice?.group ?? null;

  const colorName = (product.color || "").trim();
  const groupLabel = currentGroup
    ? lang === "en"
      ? currentGroup.labelEn
      : currentGroup.label
    : colorName;
  const hasInactive = choices.length < groups.length;
  const switchableCount = choices.filter((c) => c.linkable || c.isCurrent).length;

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
          const choice = choices.find((c) => c.group.id === group.id) ?? null;
          const label = lang === "en" ? group.labelEn : group.label;
          const face = <PaletteFace group={group} shapeOffset={index * 9} />;

          if (!choice) {
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
          }

          if (choice.isCurrent) {
            return (
              <span
                key={group.id}
                className="pdp-palette-item pdp-palette-item--card is-on is-current"
                title={label}
                aria-current="true"
              >
                {face}
                <span className="pdp-palette-name">{label}</span>
              </span>
            );
          }

          if (choice.linkable) {
            return (
              <Link
                key={group.id}
                href={`/${lang}/product/${encodeURIComponent(choice.hrefId)}`}
                className="pdp-palette-item pdp-palette-item--card is-on"
                title={label}
                aria-label={label}
                prefetch
              >
                {face}
                <span className="pdp-palette-name">{label}</span>
              </Link>
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

      {currentChoice && currentChoice.shades.length > 1 ? (
        <div
          className="pdp-palette-shades"
          role="listbox"
          aria-label={
            lang === "en" ? "Shades in this palette" : "Відтінки цієї палітри"
          }
        >
          {currentChoice.shades.map((shade, i) => {
            const shape = paintSwatchShape(i);
            const swatch = (
              <span
                className="pdp-palette-shade-swatch"
                style={{
                  backgroundColor: shade.hex,
                  borderRadius: shape.borderRadius,
                  transform: shape.transform,
                }}
                aria-hidden
              />
            );

            if (shade.isCurrent || !shade.linkable) {
              return (
                <span
                  key={shade.id}
                  className={`pdp-palette-shade${shade.isCurrent ? " is-current" : ""}`}
                  title={shade.label}
                  aria-current={shade.isCurrent ? "true" : undefined}
                >
                  {swatch}
                  <span className="pdp-palette-shade-name">{shade.label}</span>
                </span>
              );
            }

            return (
              <Link
                key={shade.id}
                href={`/${lang}/product/${encodeURIComponent(shade.id)}`}
                className="pdp-palette-shade"
                title={shade.label}
                aria-label={shade.label}
                prefetch
              >
                {swatch}
                <span className="pdp-palette-shade-name">{shade.label}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {switchableCount <= 1 && hasInactive ? (
        <p className="pdp-palette-hint">
          {lang === "en"
            ? "Other palettes light up when this model has a published colourway linked (or the same name)."
            : "Інші палітри стають клікабельними, коли є опублікований товар цього кольору з тим самим імʼям або в «Звʼязки»."}
        </p>
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
