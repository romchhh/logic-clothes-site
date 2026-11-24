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

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [pinnedShadeId, setPinnedShadeId] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroupId(null);
    setPinnedShadeId(null);
    onPinnedShadeChange?.(null);
  }, [product.id, currentGroupId, onPinnedShadeChange]);

  useEffect(() => {
    onPinnedShadeChange?.(pinnedShadeId);
  }, [pinnedShadeId, onPinnedShadeChange]);

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

  /** shadeId → stocked product variant in this family */
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

  /** Which groups have at least one stocked SKU */
  const stockedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [shadeId] of variantByShade) {
      const g = groupForPaletteId(shadeId);
      if (g) ids.add(g.id);
    }
    return ids;
  }, [variantByShade]);

  const openGroup = openGroupId
    ? groups.find((g) => g.id === openGroupId) ?? null
    : null;

  const activeShadeId = pinnedShadeId || currentPaletteId;
  const activeShade = activeShadeId ? getPaletteColor(activeShadeId) : null;
  const activeGroup =
    (activeShadeId && groupForPaletteId(activeShadeId)) ||
    (currentGroupId ? groups.find((g) => g.id === currentGroupId) ?? null : null);

  const groupLabel = activeGroup
    ? lang === "en"
      ? activeGroup.labelEn
      : activeGroup.label
    : "";
  const shadeLabel = activeShade
    ? lang === "en"
      ? activeShade.labelEn
      : activeShade.label
    : (product.color || "").trim();

  useEffect(() => {
    if (!onShadeLabelChange) return;
    const next =
      groupLabel && shadeLabel
        ? `${groupLabel} · ${shadeLabel}`
        : shadeLabel || groupLabel;
    onShadeLabelChange(next);
  }, [groupLabel, shadeLabel, onShadeLabelChange]);

  return (
    <div className="pdp-palette-block">
      {groupLabel || shadeLabel ? (
        <p className="pdp-color-caption">
          {groupLabel}
          {shadeLabel && groupLabel ? ` · ${shadeLabel}` : shadeLabel}
        </p>
      ) : null}

      <div
        className="pdp-palette-row pdp-palette-row--cards"
        role="listbox"
        aria-label={t.product.color}
      >
        {groups.map((group) => {
          const label = lang === "en" ? group.labelEn : group.label;
          const isOpen = openGroup?.id === group.id;
          const isCurrentGroup = currentGroupId === group.id;
          const hasStock = stockedGroupIds.has(group.id);
          const face = <PaletteFace group={group} />;

          return (
            <button
              key={group.id}
              type="button"
              className={[
                "pdp-palette-item pdp-palette-item--card",
                hasStock || isCurrentGroup ? "is-on" : "is-off",
                isCurrentGroup ? "is-current" : "",
                isOpen ? "is-open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={label}
              aria-label={label}
              aria-pressed={isOpen}
              onClick={() => {
                setOpenGroupId(group.id);
                if (!isCurrentGroup) {
                  // Clear shade pin when switching groups until user picks
                  setPinnedShadeId(null);
                }
              }}
            >
              {face}
              <span className="pdp-palette-name">{label}</span>
            </button>
          );
        })}
      </div>

      {openGroup ? (
        <div
          className="pdp-palette-shades"
          role="listbox"
          aria-label={
            lang === "en"
              ? `Shades — ${openGroup.labelEn}`
              : `Відтінки — ${openGroup.label}`
          }
        >
          {openGroup.shades.map((shade) => {
            const variant = variantByShade.get(shade.id);
            const label = lang === "en" ? shade.labelEn : shade.label;
            const isCurrent = variant?.isCurrent || shade.id === currentPaletteId;
            const isPinned = pinnedShadeId === shade.id;
            const swatch = (
              <span
                className="pdp-palette-shade-swatch"
                style={dabStyle(shade.hex, shade.id)}
                aria-hidden
              />
            );

            if (isCurrent) {
              return (
                <span
                  key={shade.id}
                  className="pdp-palette-shade is-current"
                  title={label}
                  aria-current="true"
                >
                  {swatch}
                  <span className="pdp-palette-shade-name">{label}</span>
                </span>
              );
            }

            if (variant?.linkable && variant.id !== product.id) {
              return (
                <Link
                  key={shade.id}
                  href={`/${lang}/product/${encodeURIComponent(variant.id)}`}
                  className="pdp-palette-shade"
                  title={label}
                  aria-label={label}
                  prefetch
                >
                  {swatch}
                  <span className="pdp-palette-shade-name">{label}</span>
                </Link>
              );
            }

            return (
              <button
                key={shade.id}
                type="button"
                className={`pdp-palette-shade is-custom${
                  isPinned ? " is-pinned" : ""
                }`}
                title={label}
                aria-pressed={isPinned}
                onClick={() =>
                  setPinnedShadeId((prev) =>
                    prev === shade.id ? null : shade.id
                  )
                }
              >
                {swatch}
                <span className="pdp-palette-shade-name">{label}</span>
              </button>
            );
          })}
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
