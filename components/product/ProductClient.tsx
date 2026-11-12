"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import ProductCustomBuilder from "@/components/product/ProductCustomBuilder";
import ProductImmersiveGallery from "@/components/product/ProductImmersiveGallery";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useWishlist } from "@/lib/WishlistProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { GARMENT_MEASURE_FIELDS, hasGarmentMeasures } from "@/lib/garmentMeasures";
import type { Locale } from "@/lib/i18n/config";
import ProductColorPalette from "@/components/product/ProductColorPalette";
import { normalizeSizeOptions } from "@/lib/catalogProduct";
import { formatDualPrice } from "@/lib/format";
import {
  formatSizeLabel,
  MADE_TO_ORDER_SIZE_GRID,
  orderBrandSizes,
} from "@/lib/productSizes";
import { SIZE_CHART_ROWS } from "@/lib/sizeChart";
import {
  productDescription,
  productName,
  type Product,
} from "@/lib/types";

const PLUS_SIZES = new Set(["A", "B", "C", "D"]);

export default function ProductClient({
  product,
  related,
  relatedKind = "look",
  lang,
}: {
  product: Product;
  related: Product[];
  relatedKind?: "look" | "newcomers";
  lang: Locale;
}) {
  const { t } = useI18n();
  const { addItem } = useBasket();
  const { isWished, toggleWish } = useWishlist();
  const { setIsBasketOpen } = useAppContext();
  const lengthOptions = product.lengthOptions?.filter(Boolean) ?? [];
  const materialOptions = product.materialOptions?.filter(Boolean) ?? [];

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedLength, setSelectedLength] = useState<string | null>(
    lengthOptions.length === 1 ? lengthOptions[0] : null
  );
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(
    materialOptions.length === 1 ? materialOptions[0] : null
  );
  const [sizeHint, setSizeHint] = useState(false);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [measuresOpen, setMeasuresOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [lengthHint, setLengthHint] = useState(false);
  const [materialHint, setMaterialHint] = useState(false);
  const sizeBlockRef = useRef<HTMLDivElement>(null);
  const lengthBlockRef = useRef<HTMLDivElement>(null);
  const materialBlockRef = useRef<HTMLDivElement>(null);

  const wished = isWished(product.id);
  const displayName = productName(product, lang);
  const displayDesc = productDescription(product, lang);
  const images = product.images;
  const slides =
    product.media && product.media.length > 0
      ? product.media.map((m) => ({
          url: m.url,
          type: m.type === "video" ? ("video" as const) : ("image" as const),
          adjust: m.adjust,
          ...(m.poster ? { poster: m.poster } : {}),
        }))
      : images.map((url) => ({ url, type: "image" as const }));
  const showMeasures = hasGarmentMeasures(product.garmentMeasures);
  const stockSizes = normalizeSizeOptions(product.sizeOptions);
  const inStockSizeSet = new Set(
    product.inStock && stockSizes.length > 0 ? stockSizes : []
  );
  // Always show full brand grid — stocked sizes are active, others sew CTA.
  const displaySizes = orderBrandSizes([
    ...MADE_TO_ORDER_SIZE_GRID,
    ...stockSizes,
  ]);
  const canAddToCart = Boolean(product.inStock) && inStockSizeSet.size > 0;
  const onSale =
    product.isSale ||
    (product.compareAtPriceNum != null &&
      product.compareAtPriceNum > product.priceNum);

  const fabricValue = [product.fabricName?.trim(), product.material?.trim()]
    .filter(Boolean)
    .join(" ");
  const liningValue = [
    product.lining?.trim(),
    product.liningComposition?.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const insulationValue = product.insulation?.trim() || "";
  const showFabricSpecs = Boolean(
    fabricValue || liningValue || insulationValue
  );

  useEffect(() => {
    setSelectedSize(null);
    setSelectedLength(lengthOptions.length === 1 ? lengthOptions[0] : null);
    setSelectedMaterial(
      materialOptions.length === 1 ? materialOptions[0] : null
    );
    setSizeHint(false);
    setLengthHint(false);
    setMaterialHint(false);
  }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps -- reset on SKU change

  useEffect(() => {
    if (!sizeHint) return;
    const id = window.setTimeout(() => setSizeHint(false), 4000);
    return () => window.clearTimeout(id);
  }, [sizeHint]);

  useEffect(() => {
    if (!lengthHint) return;
    const id = window.setTimeout(() => setLengthHint(false), 4000);
    return () => window.clearTimeout(id);
  }, [lengthHint]);

  useEffect(() => {
    if (!materialHint) return;
    const id = window.setTimeout(() => setMaterialHint(false), 4000);
    return () => window.clearTimeout(id);
  }, [materialHint]);

  function selectSize(sz: string) {
    setSelectedSize(sz);
    setSizeHint(false);
  }

  function openBuilder() {
    setBuilderOpen(true);
    window.requestAnimationFrame(() => {
      document
        .querySelector(".pdp-builder")
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  function addToCart() {
    if (!canAddToCart) {
      openBuilder();
      return;
    }
    if (lengthOptions.length > 0 && !selectedLength) {
      setLengthHint(true);
      lengthBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (materialOptions.length > 0 && !selectedMaterial) {
      setMaterialHint(true);
      materialBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!selectedSize || !inStockSizeSet.has(selectedSize)) {
      setSizeHint(true);
      sizeBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    const colorLabel = (product.color || "").trim() || undefined;
    const lengthLabel = selectedLength || undefined;
    const materialLabel = selectedMaterial || undefined;
    const variantLine = [selectedSize, lengthLabel, materialLabel, colorLabel]
      .filter(Boolean)
      .join(" · ");
    addItem({
      id: product.id,
      name: displayName,
      price: product.price,
      priceNum: product.priceNum,
      size: variantLine,
      sizeLabel: selectedSize,
      ...(lengthLabel ? { length: lengthLabel } : {}),
      ...(materialLabel ? { material: materialLabel } : {}),
      ...(colorLabel ? { color: colorLabel } : {}),
      quantity: 1,
      image: images[0],
    });
    setIsBasketOpen(true);
  }

  function addCustom(size: string, note: string) {
    const colorLabel = (product.color || "").trim() || undefined;
    addItem({
      id: product.id,
      name: displayName,
      price: product.price,
      priceNum: product.priceNum,
      size: [size, note, colorLabel].filter(Boolean).join(" · "),
      sizeLabel: size,
      ...(colorLabel ? { color: colorLabel } : {}),
      ...(note ? { material: note } : {}),
      quantity: 1,
      image: images[0],
    });
    setIsBasketOpen(true);
  }

  return (
    <div className="pdp pdp--immersive">
      <div className="pdp-immersive-shell">
        <div className="pdp-immersive-media">
          <ProductImmersiveGallery
            slides={slides}
            alt={displayName}
            prevLabel={t.a11y.prevPhoto}
            nextLabel={t.a11y.nextPhoto}
            closeLabel={t.a11y.close}
          />
        </div>

        <div className="pdp-detail">
          <header className="pdp-intro pdp-intro--row">
            <h1 className="pdp-title">{displayName}</h1>
            <div className="pdp-price">
              {onSale && product.compareAtPriceNum != null && (
                <span className="pdp-price-old">
                  {product.compareAtPriceNum.toLocaleString("uk-UA")} грн
                </span>
              )}
              <span>{formatDualPrice(product)}</span>
            </div>
          </header>

          {displayDesc ? (
            <p className="pdp-desc pdp-desc--lead">{displayDesc}</p>
          ) : null}

          {showFabricSpecs ? (
            <dl className="pdp-fabric-grid">
              {fabricValue ? (
                <div>
                  <dt>{t.product.fabricMaterialLabel}</dt>
                  <dd>{fabricValue}</dd>
                </div>
              ) : null}
              {insulationValue ? (
                <div>
                  <dt>{t.product.insulation}</dt>
                  <dd>{insulationValue}</dd>
                </div>
              ) : null}
              {liningValue ? (
                <div>
                  <dt>{t.product.liningLabel}</dt>
                  <dd>{liningValue}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <div
            className={`pdp-option pdp-option--size${sizeHint ? " is-hint" : ""}`}
            ref={sizeBlockRef}
          >
            <p className="pdp-label">{t.product.size}</p>
            <div
              className="pdp-sizes pdp-sizes--text"
              role="listbox"
              aria-label={t.product.size}
              aria-invalid={sizeHint}
            >
              {displaySizes.map((sz) => {
                const stocked = inStockSizeSet.has(sz);
                const plus = PLUS_SIZES.has(sz);
                if (stocked) {
                  return (
                    <button
                      key={sz}
                      className={`pdp-size pdp-size--text is-stocked${
                        selectedSize === sz ? " is-active" : ""
                      }${plus ? " is-plus" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={selectedSize === sz}
                      onClick={() => selectSize(sz)}
                    >
                      {formatSizeLabel(sz)}
                    </button>
                  );
                }
                return (
                  <span key={sz} className="pdp-size-wrap">
                    <button
                      className={`pdp-size pdp-size--text is-off${
                        plus ? " is-plus" : ""
                      }`}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={openBuilder}
                    >
                      {formatSizeLabel(sz)}
                    </button>
                    <button
                      type="button"
                      className="pdp-size-sew-cta"
                      onClick={openBuilder}
                    >
                      {t.product.sewMySize}
                    </button>
                  </span>
                );
              })}
            </div>
            <button
              type="button"
              className="pdp-disclosure"
              aria-expanded={sizeChartOpen}
              onClick={() => setSizeChartOpen((v) => !v)}
            >
              {sizeChartOpen
                ? t.product.closeSizeChart
                : t.product.openSizeChart}
            </button>
            {sizeChartOpen ? (
              <div
                className="pdp-size-chart pdp-size-chart--inline"
                id="pdp-size-chart"
              >
                <table className="pdp-size-table pdp-size-table--brand">
                  <thead>
                    <tr>
                      <th scope="col">{t.product.sizeCol}</th>
                      <th scope="col">{t.product.bust}</th>
                      <th scope="col">{t.product.waist}</th>
                      <th scope="col">{t.product.hips}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_CHART_ROWS.map((row) => (
                      <tr key={row.size}>
                        <th scope="row">{row.size}</th>
                        <td>{row.bust}</td>
                        <td>{row.waist}</td>
                        <td>{row.hips}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  className="pdp-disclosure"
                  onClick={() => setSizeChartOpen(false)}
                >
                  {t.product.closeSizeChart}
                </button>
              </div>
            ) : null}
            {sizeHint && (
              <p className="pdp-inline-hint" role="status">
                {t.product.pickSize}
              </p>
            )}
          </div>

          {lengthOptions.length > 0 && (
            <div
              className={`pdp-option pdp-option--length${lengthOptions.length === 1 ? " is-static" : ""}${lengthHint ? " is-hint" : ""}`}
              ref={lengthBlockRef}
            >
              <div className="pdp-option-top">
                <p className="pdp-label">{t.product.length}</p>
                {(lengthOptions.length === 1 || selectedLength) && (
                  <p className="pdp-option-value">
                    {lengthOptions.length === 1
                      ? lengthOptions[0]
                      : selectedLength}
                  </p>
                )}
              </div>
              {lengthOptions.length > 1 && (
                <div
                  className="pdp-sizes"
                  role="listbox"
                  aria-label={t.product.length}
                  aria-invalid={lengthHint}
                >
                  {lengthOptions.map((value) => (
                    <button
                      key={value}
                      className={`pdp-size${selectedLength === value ? " is-active" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={selectedLength === value}
                      onClick={() => {
                        setSelectedLength(value);
                        setLengthHint(false);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              )}
              {lengthHint && (
                <p className="pdp-inline-hint" role="status">
                  {t.product.pickLength}
                </p>
              )}
            </div>
          )}

          {materialOptions.length > 1 && (
            <div
              className={`pdp-option pdp-option--material${materialHint ? " is-hint" : ""}`}
              ref={materialBlockRef}
            >
              <div className="pdp-option-top">
                <p className="pdp-label">{t.product.materialVariant}</p>
                {selectedMaterial ? (
                  <p className="pdp-option-value">{selectedMaterial}</p>
                ) : null}
              </div>
              <div
                className="pdp-sizes"
                role="listbox"
                aria-label={t.product.materialVariant}
                aria-invalid={materialHint}
              >
                {materialOptions.map((value) => (
                  <button
                    key={value}
                    className={`pdp-size${selectedMaterial === value ? " is-active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={selectedMaterial === value}
                    onClick={() => {
                      setSelectedMaterial(value);
                      setMaterialHint(false);
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {materialHint && (
                <p className="pdp-inline-hint" role="status">
                  {t.product.pickMaterial}
                </p>
              )}
            </div>
          )}

          {(product.photoSize || product.modelParams) && (
            <div className="pdp-model-facts">
              {product.photoSize ? (
                <p>
                  <span>{t.product.photoSizeLabel}: </span>
                  {product.photoSize}
                </p>
              ) : null}
              {product.modelParams ? (
                <p className="pdp-model-facts-sub">
                  {t.product.modelParamsLabel}; {product.modelParams}
                </p>
              ) : null}
            </div>
          )}

          {showMeasures ? (
            <div className="pdp-measures">
              <button
                type="button"
                className="pdp-disclosure"
                aria-expanded={measuresOpen}
                onClick={() => setMeasuresOpen((v) => !v)}
              >
                {measuresOpen
                  ? t.product.closeSizeChart
                  : t.product.actualMeasures}
              </button>
              {measuresOpen ? (
                <dl className="pdp-measures-list">
                  {GARMENT_MEASURE_FIELDS.map((field) => {
                    const value = product.garmentMeasures?.[field.key];
                    if (!value) return null;
                    return (
                      <div key={field.key}>
                        <dt>{lang === "en" ? field.labelEn : field.label}</dt>
                        <dd>{value}</dd>
                      </div>
                    );
                  })}
                </dl>
              ) : null}
            </div>
          ) : null}

          <div className="pdp-block pdp-buy-opts">
            <ProductColorPalette
              product={product}
              lang={lang}
              onRequestSew={openBuilder}
            />
          </div>

          <div className="pdp-actions pdp-actions--immersive">
            <button
              className={`pdp-cart pdp-cart--compact${
                canAddToCart ? "" : " pdp-cart--sew"
              }`}
              type="button"
              onClick={addToCart}
            >
              {canAddToCart ? t.product.addToCart : t.product.orderSew}
            </button>
            <button
              className={`pdp-wishlist-link${wished ? " is-on" : ""}`}
              type="button"
              aria-pressed={wished}
              onClick={() =>
                toggleWish({
                  id: product.id,
                  name: displayName,
                  price: product.price,
                  priceNum: product.priceNum,
                  image: images[0],
                })
              }
            >
              {wished ? t.product.inWish : t.product.addWish}
            </button>
            <button
              type="button"
              className={`pdp-custom-order-cta${builderOpen ? " is-open" : ""}`}
              aria-expanded={builderOpen}
              onClick={() =>
                builderOpen ? setBuilderOpen(false) : openBuilder()
              }
            >
              {t.product.orderMyColorSize}
            </button>
          </div>

          {builderOpen ? (
            <ProductCustomBuilder
              product={product}
              lang={lang}
              sizes={displaySizes}
              onAdd={addCustom}
            />
          ) : null}
        </div>
      </div>

      {related.length > 0 && (
        <section
          className={`pdp-related pdp-related--look${
            relatedKind === "newcomers" ? " pdp-related--newcomers" : ""
          }`}
          aria-label={
            relatedKind === "newcomers"
              ? t.home.newcomers
              : t.product.lookTitle
          }
        >
          <div className="pdp-related-head">
            <h2 className="pdp-section-title">
              {relatedKind === "newcomers"
                ? t.home.newcomers
                : t.product.lookTitle}
            </h2>
          </div>
          <div className="pdp-related-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="pdp-immersive-tail">
      <div className="pdp-below pdp-below--immersive">
          <div className="pdp-service">
            <section className="pdp-service-block">
              <h2 className="pdp-section-title">{t.product.deliveryTitle}</h2>
              <ul>
                {t.product.deliveryText.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link
                href={`/${lang}/shipping-payment`}
                className="pdp-service-link"
              >
                {t.footer.shipping}
              </Link>
            </section>
            <section className="pdp-service-block">
              <h2 className="pdp-section-title">{t.product.paymentTitle}</h2>
              <ul>
                {t.product.paymentText.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <Link
                href={`/${lang}/shipping-payment`}
                className="pdp-service-link"
              >
                {t.footer.shipping}
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
