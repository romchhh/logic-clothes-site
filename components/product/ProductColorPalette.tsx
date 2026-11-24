"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  getPaletteColor,
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
  type PaletteGroup,
} from "@/lib/colorPalette";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product, ProductColorVariant } from "@/lib/types";

type VariantChoice = {
  id: string;
  paletteId: string;
  label: string;
  hex: string;
  isCurrent: boolean;
  linkable: boolean;
};

function dabStyle(hex: string, shadeId: string): CSSProperties {
  const isMulti = shadeId === "multi" || hex.toUpperCase() === "#FFFFFF";
  return {
    background: isMulti
      ? "conic-gradient(from 120deg, #c4282e, #e06a28, #e8c84a, #3f7a4e, #1a3a5c, #6a3a7a, #e868a0, #c4282e)"
      : hex,
    borderRadius: 0,
    filter: isMulti ? undefined : "saturate(1.35)",
  };
}

function PaletteFace({ group }: { group: PaletteGroup }) {
  return (
    <span className="pdp-palette-card-grid" aria-hidden>
      {group.shades.slice(0, 9).map((shade) => (
        <span
          key={shade.id}
          className="pdp-palette-card-dab"
          style={dabStyle(shade.hex, shade.id)}
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
  onRequestSew,
  onShadeLabelChange,
  onPinnedShadeChange,
}: {
  product: Product;
  lang: Locale;
  onRequestSew?: () => void;
  onShadeLabelChange?: (label: string) => void;
  onPinnedShadeChange?: (shadeId: string | null) => void;
}) {
  const { t } = useI18n();
  const groups = getPaletteGroups();

  const currentPaletteId = useMemo(
    () =>
      resolvePaletteId({
        color: product.color,
        colorHex: product.colorHex,
      }),
    [product.color, product.colorHex]
  );

  const currentGroupId =
    groupForPaletteId(currentPaletteId)?.id ?? null;

  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(
    currentGroupId
  );

  useEffect(() => {
    setHighlightGroupId(currentGroupId);
    onPinnedShadeChange?.(null);
  }, [product.id, currentGroupId, onPinnedShadeChange]);

  const family = useMemo(() => {
    const byId = new Map<string, ProductColorVariant>();
    const self: ProductColorVariant = {
      id: product.id,
      name: product.name,
      color: product.color,
      image: product.images[0] || "",
      hex: product.colorHex,
      isVisible: product.isVisible !== false,
      paletteId: currentPaletteId,
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
  }, [product, currentPaletteId]);

  const variantByShade = useMemo(() => {
    const map = new Map<string, VariantChoice>();
    for (const m of family) {
      const paletteId = memberPaletteId(m);
      if (!paletteId) continue;
      const linkable = isLinkableVariant(m, product.id);
      if (!linkable && m.id !== product.id) continue;
      const shade = getPaletteColor(paletteId);
      const label =
        m.color ||
        (shade
          ? lang === "en"
            ? shade.labelEn
            : shade.label
          : paletteId);
      map.set(paletteId, {
        id: m.id,
        paletteId,
        label,
        hex: m.hex || shade?.hex || "#ccc",
        isCurrent: m.id === product.id,
        linkable,
      });
    }
    return map;
  }, [family, lang, product.id]);

  const stockedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [shadeId] of variantByShade) {
      const g = groupForPaletteId(shadeId);
      if (g) ids.add(g.id);
    }
    return ids;
  }, [variantByShade]);

  const currentGroup =
    currentGroupId != null
      ? groups.find((g) => g.id === currentGroupId) ?? null
      : null;

  const groupLabel = currentGroup
    ? lang === "en"
      ? currentGroup.labelEn
      : currentGroup.label
    : "";

  const storefrontName = (product.color || "").trim();
  const paletteShade = currentPaletteId
    ? getPaletteColor(currentPaletteId)
    : null;
  const fallbackShadeLabel = paletteShade
    ? lang === "en"
      ? paletteShade.labelEn
      : paletteShade.label
    : "";
  const displayName = storefrontName || fallbackShadeLabel;
  const displayHex =
    product.colorHex?.trim() ||
    paletteShade?.hex ||
    "#ccc";
  const displayShadeId = currentPaletteId || "custom";

  const siblingLinks = useMemo(() => {
    const out: VariantChoice[] = [];
    for (const v of variantByShade.values()) {
      if (v.isCurrent || !v.linkable || v.id === product.id) continue;
      out.push(v);
    }
    return out;
  }, [variantByShade, product.id]);

  useEffect(() => {
    if (!onShadeLabelChange) return;
    onShadeLabelChange(displayName || groupLabel);
  }, [displayName, groupLabel, onShadeLabelChange]);

  return (
    <div className="pdp-palette-block">
      {groupLabel ? (
        <p className="pdp-color-caption">{groupLabel}</p>
      ) : null}

      <div
        className="pdp-palette-row pdp-palette-row--cards"
        role="listbox"
        aria-label={t.product.color}
      >
        {groups.map((group) => {
          const label = lang === "en" ? group.labelEn : group.label;
          const isHighlighted = highlightGroupId === group.id;
          const isCurrentGroup = currentGroupId === group.id;
          const hasStock = stockedGroupIds.has(group.id);

          return (
            <button
              key={group.id}
              type="button"
              className={[
                "pdp-palette-item pdp-palette-item--card",
                hasStock || isCurrentGroup ? "is-on" : "is-off",
                isCurrentGroup ? "is-current" : "",
                isHighlighted ? "is-open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={label}
              aria-label={label}
              aria-pressed={isHighlighted}
              onClick={() =>
                setHighlightGroupId((prev) =>
                  prev === group.id ? null : group.id
                )
              }
            >
              <PaletteFace group={group} />
              <span className="pdp-palette-name">{label}</span>
            </button>
          );
        })}
      </div>

      {displayName ? (
        <div className="pdp-palette-single">
          <span
            className="pdp-palette-shade is-current pdp-palette-single-chip"
            aria-current="true"
          >
            <span
              className="pdp-palette-shade-swatch"
              style={dabStyle(displayHex, displayShadeId)}
              aria-hidden
            />
            <span className="pdp-palette-shade-name">{displayName}</span>
          </span>
        </div>
      ) : null}

      {siblingLinks.length > 0 ? (
        <div
          className="pdp-palette-siblings"
          role="list"
          aria-label={lang === "uk" ? "Інші кольори моделі" : "Other colourways"}
        >
          {siblingLinks.map((v) => (
            <Link
              key={v.id}
              href={`/${lang}/product/${encodeURIComponent(v.id)}`}
              className="pdp-palette-shade"
              title={v.label}
              prefetch
            >
              <span
                className="pdp-palette-shade-swatch"
                style={dabStyle(v.hex, v.paletteId)}
                aria-hidden
              />
              <span className="pdp-palette-shade-name">{v.label}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {onRequestSew ? (
        <div className="pdp-palette-sew-wrap">
          <button
            type="button"
            className="pdp-palette-sew-cta is-inline"
            onClick={() => onRequestSew()}
          >
            {t.product.sewMyColor}
          </button>
        </div>
      ) : null}
    </div>
  );
}