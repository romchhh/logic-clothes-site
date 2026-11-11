"use client";

import { useMemo, useState, type CSSProperties } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import {
  getPaletteGroups,
  groupForPaletteId,
  resolvePaletteId,
} from "@/lib/colorPalette";
import { paintSwatchShape } from "@/lib/paletteSwatchShape";
import { formatDualPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

function dabStyle(hex: string, index: number): CSSProperties {
  const shape = paintSwatchShape(index);
  return {
    background: hex,
    borderRadius: shape.borderRadius,
    transform: shape.transform,
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
      <p className="pdp-builder-note">
        {lang === "uk"
          ? "Оберіть загальну гаму — відтінки узгодимо пізніше."
          : "Pick a colour family — we refine the shade later."}
      </p>
      <div className="pdp-palette-row pdp-palette-row--cards pdp-builder-palettes">
        {groups.map((group, gi) => {
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
                {group.shades.slice(0, 9).map((shade, i) => (
                  <span
                    key={shade.id}
                    className="pdp-palette-card-dab"
                    style={dabStyle(shade.hex, gi * 9 + i)}
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
      <div className="pdp-sizes">
        {sizes.map((sz) => (
          <button
            key={sz}
            type="button"
            className={`pdp-size${size === sz ? " is-active" : ""}`}
            onClick={() => setSize(sz)}
          >
            {sz.replace(/-/g, "\u2011")}
          </button>
        ))}
      </div>

      <p className="pdp-builder-label">
        {lang === "uk" ? "замовити по власних параметрах" : "order to your measurements"}
      </p>
      <div className="pdp-builder-measures">
        <label>
          {lang === "uk" ? "зріст" : "height"}
          <input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          {lang === "uk" ? "обʼєм грудей" : "bust"}
          <input value={bust} onChange={(e) => setBust(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          {lang === "uk" ? "обʼєм талії" : "waist"}
          <input value={waist} onChange={(e) => setWaist(e.target.value)} inputMode="decimal" />
        </label>
        <label>
          {lang === "uk" ? "обʼєм стегон" : "hips"}
          <input value={hips} onChange={(e) => setHips(e.target.value)} inputMode="decimal" />
        </label>
      </div>

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
        {t.product.addToCart}
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
