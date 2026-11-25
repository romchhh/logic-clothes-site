"use client";

import { useMemo, useState, type CSSProperties } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  getPaletteColor,
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
} from "@/lib/colorPalette";
import { SIZE_ROW_BASE, SIZE_ROW_MORE } from "@/lib/productSizes";
import ProductSizeBoard from "@/components/product/ProductSizeBoard";
import { formatDualPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

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

export default function ProductCustomBuilder({
  product,
  lang,
  sizes,
  inStockSizes = [],
  initialSize = null,
  onAdd,
  preferredShadeId = null,
}: {
  product: Product;
  lang: Locale;
  sizes: string[];
  inStockSizes?: string[];
  initialSize?: string | null;
  onAdd: (size: string, note: string) => void;
  preferredShadeId?: string | null;
}) {
  const { t } = useI18n();
  const groups = getPaletteGroups();
  const productShadeId =
    resolvePaletteId({
      color: product.color,
      colorHex: product.colorHex,
    }) ?? null;
  const defaultShadeId = preferredShadeId || productShadeId;
  const defaultGroupId = groupForPaletteId(defaultShadeId)?.id ?? null;

  const [size, setSize] = useState<string | null>(initialSize);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [shadeIds, setShadeIds] = useState<string[]>(
    defaultShadeId ? [defaultShadeId] : []
  );
  const [customMeasures, setCustomMeasures] = useState(false);
  const [height, setHeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const openGroup = groups.find((g) => g.id === openGroupId) ?? null;

  const shadeLabels = useMemo(
    () =>
      shadeIds
        .map((id) => getPaletteColor(id))
        .filter(Boolean)
        .map((c) => (lang === "en" ? c!.labelEn : c!.label)),
    [shadeIds, lang]
  );

  const note = [
    shadeLabels.length
      ? `${lang === "uk" ? "кольори" : "colours"}: ${shadeLabels.join(", ")}`
      : "",
    height && `${lang === "uk" ? "зріст" : "height"} ${height}`,
    bust && `${lang === "uk" ? "груди" : "bust"} ${bust}`,
    waist && `${lang === "uk" ? "талія" : "waist"} ${waist}`,
    hips && `${lang === "uk" ? "стегна" : "hips"} ${hips}`,
  ]
    .filter(Boolean)
    .join(", ");

  function toggleShade(id: string) {
    setShadeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <section className="pdp-builder" aria-label={t.product.customOrderTitle}>
      <h2 className="pdp-builder-title">{t.product.customOrderTitle}</h2>
      <p className="pdp-builder-lead">{t.product.customOrderLead}</p>

      <p className="pdp-builder-label">
        {lang === "uk" ? "бажані кольори" : "desired colours"}
      </p>
      <div className="pdp-palette-row pdp-palette-row--cards pdp-builder-palettes">
        {groups.map((group) => {
          const label = lang === "en" ? group.labelEn : group.label;
          const isOpen = openGroupId === group.id;
          const hasPick = group.shades.some((s) => shadeIds.includes(s.id));
          return (
            <button
              key={group.id}
              type="button"
              className={`pdp-palette-item pdp-palette-item--card${
                isOpen || hasPick ? " is-on" : ""
              }${hasPick ? " is-current" : ""}${isOpen ? " is-open" : ""}`}
              aria-pressed={isOpen}
              title={label}
              onClick={() => setOpenGroupId(group.id)}
            >
              <span className="pdp-palette-card-grid" aria-hidden>
                {group.shades.slice(0, 9).map((shade) => (
                  <span
                    key={shade.id}
                    className="pdp-palette-card-dab"
                    style={dabStyle(shade.hex, shade.id)}
                  />
                ))}
              </span>
              <span className="pdp-palette-name">{label}</span>
            </button>
          );
        })}
      </div>

      {openGroup ? (
        <div
          className="pdp-palette-shades"
          role="group"
          aria-label={
            lang === "en"
              ? `Shades — ${openGroup.labelEn}`
              : `Відтінки — ${openGroup.label}`
          }
        >
          {openGroup.shades.map((shade) => {
            const label = lang === "en" ? shade.labelEn : shade.label;
            const on = shadeIds.includes(shade.id);
            return (
              <button
                key={shade.id}
                type="button"
                className={`pdp-palette-shade${on ? " is-current is-pinned" : ""}`}
                title={label}
                aria-pressed={on}
                onClick={() => toggleShade(shade.id)}
              >
                <span
                  className="pdp-palette-shade-swatch"
                  style={dabStyle(shade.hex, shade.id)}
                  aria-hidden
                />
                <span className="pdp-palette-shade-name">{label}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {shadeLabels.length ? (
        <p className="pdp-builder-note">
          {t.product.customOrderSelected}: {shadeLabels.join(" · ")}
        </p>
      ) : null}

      {product.lengthOptions && product.lengthOptions.length > 0 ? (
        <>
          <p className="pdp-builder-label">{t.product.length}</p>
          <p className="pdp-builder-note">{product.lengthOptions.join(" · ")}</p>
        </>
      ) : null}

      {product.materialOptions && product.materialOptions.length > 0 ? (
        <>
          <p className="pdp-builder-label">{t.product.fabricKind}</p>
          <p className="pdp-builder-note">{product.materialOptions.join(" · ")}</p>
        </>
      ) : null}

      <ProductSizeBoard
        inStock={new Set(inStockSizes)}
        selected={size}
        extraSizes={sizes.filter(
          (sz) =>
            !(SIZE_ROW_BASE as readonly string[]).includes(sz) &&
            !(SIZE_ROW_MORE as readonly string[]).includes(sz)
        )}
        onSelect={(sz) => setSize(sz)}
      />

      <div className="pdp-builder-measures-toggle">
        <button
          type="button"
          className={`pdp-builder-sew-cta${customMeasures ? " is-open" : ""}`}
          aria-expanded={customMeasures}
          onClick={() => setCustomMeasures((v) => !v)}
        >
          {t.product.orderByMeasures}
        </button>
      </div>

      {customMeasures ? (
        <div className="pdp-builder-measures">
          <label>
            {lang === "uk" ? "зріст" : "height"}
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label>
            {lang === "uk" ? "обʼєм грудей" : "bust"}
            <input
              value={bust}
              onChange={(e) => setBust(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label>
            {lang === "uk" ? "обʼєм талії" : "waist"}
            <input
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label>
            {lang === "uk" ? "обʼєм стегон" : "hips"}
            <input
              value={hips}
              onChange={(e) => setHips(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>
      ) : null}

      <div className="pdp-builder-total">
        <span>{lang === "uk" ? "калькулятор замовлення" : "order total"}</span>
        <strong>{formatDualPrice(product)}</strong>
      </div>

      <button
        type="button"
        className="pdp-cart"
        disabled={!size}
        onClick={() => size && onAdd(size, note)}
      >
        {t.product.orderSew}
      </button>

      <ProductDiscussOrder
        lang={lang}
        productId={product.id}
        productName={product.name}
        shadeLabel={[shadeLabels.join(" · ") || product.color, size, note]
          .filter(Boolean)
          .join(" · ")}
        label={t.product.customOrderCta}
      />
    </section>
  );
}
