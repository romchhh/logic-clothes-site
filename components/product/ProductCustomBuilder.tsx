"use client";

import { useMemo, useState, type CSSProperties } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
} from "@/lib/colorPalette";
import { formatSizeLabel } from "@/lib/productSizes";
import { formatDualPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

const PLUS_SIZES = new Set(["A", "B", "C", "D"]);

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
  onAdd,
}: {
  product: Product;
  lang: Locale;
  sizes: string[];
  onAdd: (size: string, note: string) => void;
}) {
  const { t } = useI18n();
  const groups = getPaletteGroups();
  const defaultGroupId =
    groupForPaletteId(
      resolvePaletteId({
        color: product.color,
        colorHex: product.colorHex,
      })
    )?.id ?? null;
  const [size, setSize] = useState<string | null>(null);
  const [paletteIds, setPaletteIds] = useState<string[]>(
    defaultGroupId ? [defaultGroupId] : []
  );
  const [customMeasures, setCustomMeasures] = useState(false);
  const [height, setHeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const paletteLabels = useMemo(
    () =>
      paletteIds
        .map((id) => groups.find((g) => g.id === id))
        .filter(Boolean)
        .map((g) => (lang === "en" ? g!.labelEn : g!.label)),
    [paletteIds, groups, lang]
  );

  const note = [
    paletteLabels.length
      ? `${lang === "uk" ? "палітри" : "palettes"}: ${paletteLabels.join(", ")}`
      : "",
    height && `${lang === "uk" ? "зріст" : "height"} ${height}`,
    bust && `${lang === "uk" ? "груди" : "bust"} ${bust}`,
    waist && `${lang === "uk" ? "талія" : "waist"} ${waist}`,
    hips && `${lang === "uk" ? "стегна" : "hips"} ${hips}`,
  ]
    .filter(Boolean)
    .join(", ");

  function togglePalette(id: string) {
    setPaletteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <section className="pdp-builder" aria-label={t.product.customOrderTitle}>
      <h2 className="pdp-builder-title">{t.product.customOrderTitle}</h2>
      <p className="pdp-builder-lead">{t.product.customOrderLead}</p>

      <p className="pdp-builder-label">
        {lang === "uk" ? "бажані палітри" : "desired palettes"}
      </p>
      <div className="pdp-palette-row pdp-palette-row--cards pdp-builder-palettes">
        {groups.map((group) => {
          const on = paletteIds.includes(group.id);
          const label = lang === "en" ? group.labelEn : group.label;
          return (
            <button
              key={group.id}
              type="button"
              className={`pdp-palette-item pdp-palette-item--card${
                on ? " is-on is-current" : ""
              }`}
              aria-pressed={on}
              title={label}
              onClick={() => togglePalette(group.id)}
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
      {paletteLabels.length ? (
        <p className="pdp-builder-note">
          {t.product.customOrderSelected}: {paletteLabels.join(" · ")}
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

      <p className="pdp-builder-label">{t.product.size}</p>
      <div className="pdp-sizes pdp-sizes--text">
        {sizes.map((sz) => {
          const plus = PLUS_SIZES.has(sz);
          return (
            <button
              key={sz}
              type="button"
              className={`pdp-size pdp-size--text is-stocked${
                size === sz ? " is-active" : ""
              }${plus ? " is-plus" : ""}`}
              onClick={() => setSize(sz)}
            >
              {formatSizeLabel(sz)}
            </button>
          );
        })}
      </div>

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
        shadeLabel={[paletteLabels.join(" · ") || product.color, size, note]
          .filter(Boolean)
          .join(" · ")}
        label={t.product.customOrderCta}
      />
    </section>
  );
}
