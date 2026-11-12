"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import {
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
  type PaletteGroup,
} from "@/lib/colorPalette";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product, ProductColorVariant } from "@/lib/types";

type ShadeChoice = {
  id: string;
  label: string;
  hex: string;
  isCurrent: boolean;
  linkable: boolean;
};

type GroupChoice = {
  group: PaletteGroup;
  hrefId: string;
  isCurrent: boolean;
  linkable: boolean;
  shades: ShadeChoice[];
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
}: {
  product: Product;
  lang: Locale;
  onRequestSew?: () => void;
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
        {groups.map((group) => {
          const choice = choices.find((c) => c.group.id === group.id) ?? null;
          const label = lang === "en" ? group.labelEn : group.label;
          const face = <PaletteFace group={group} />;

          if (choice?.isCurrent) {
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

          if (choice?.linkable) {
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
            <button
              key={group.id}
              type="button"
              className="pdp-palette-item pdp-palette-item--card is-off"
              title={label}
              onClick={() => onRequestSew?.()}
            >
              {face}
              <span className="pdp-palette-name">{label}</span>
              <span className="pdp-palette-sew-cta" aria-hidden>
                {t.product.sewMyColor}
              </span>
            </button>
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
          {currentChoice.shades.map((shade) => {
            const swatch = (
              <span
                className="pdp-palette-shade-swatch"
                style={{
                  background:
                    shade.id === "multi"
                      ? "conic-gradient(from 120deg, #c4282e, #e06a28, #e8c84a, #3f7a4e, #1a3a5c, #6a3a7a, #e868a0, #c4282e)"
                      : shade.hex,
                  borderRadius: 0,
                  filter:
                    shade.id === "multi" ? undefined : "saturate(1.35)",
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
    </div>
  );
}
