"use client";

import { useState } from "react";
import ProductDiscussOrder from "@/components/product/ProductDiscussOrder";
import { formatDualPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/lib/types";

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
  const [size, setSize] = useState<string | null>(null);
  const [height, setHeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const note = [
    height && `${lang === "uk" ? "зріст" : "height"} ${height}`,
    bust && `${lang === "uk" ? "груди" : "bust"} ${bust}`,
    waist && `${lang === "uk" ? "талія" : "waist"} ${waist}`,
    hips && `${lang === "uk" ? "стегна" : "hips"} ${hips}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="pdp-builder" aria-label={t.product.customOrderTitle}>
      <h2 className="pdp-builder-title">{t.product.customOrderTitle}</h2>
      <p className="pdp-builder-lead">{t.product.customOrderLead}</p>

      <p className="pdp-builder-label">
        {lang === "uk" ? "орієнтовна бажана гама" : "desired colour range"}
      </p>
      <p className="pdp-builder-note">{product.color || "—"}</p>

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
        shadeLabel={[product.color, size, note].filter(Boolean).join(" · ")}
        label={t.product.customOrderCta}
      />
    </section>
  );
}
