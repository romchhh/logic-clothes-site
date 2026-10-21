"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useWishlist } from "@/lib/WishlistProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import ProductColorPalette from "@/components/product/ProductColorPalette";
import {
  isSellableProduct,
  normalizeSizeOptions,
} from "@/lib/catalogProduct";
import { formatDualPrice } from "@/lib/format";
import { CUSTOM_SIZE_VALUE, SIZE_CHART_ROWS } from "@/lib/sizeChart";
import {
  productDescription,
  productName,
  type Product,
} from "@/lib/types";

export default function ProductClient({
  product,
  related,
  lang,
}: {
  product: Product;
  related: Product[];
  lang: Locale;
}) {
  const { t } = useI18n();
  const { addItem } = useBasket();
  const { isWished, toggleWish } = useWishlist();
  const {
    setIsBasketOpen,
    isBasketOpen,
    isWishOpen,
    isSearchOpen,
    isMenuOpen,
  } = useAppContext();
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
  const [lengthHint, setLengthHint] = useState(false);
  const [materialHint, setMaterialHint] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const sizeBlockRef = useRef<HTMLDivElement>(null);
  const lengthBlockRef = useRef<HTMLDivElement>(null);
  const materialBlockRef = useRef<HTMLDivElement>(null);

  const panelsOpen =
    isBasketOpen || isWishOpen || isSearchOpen || isMenuOpen;
  const hideMobileBar = panelsOpen || footerInView;

  const wished = isWished(product.id);
  const displayName = productName(product, lang);
  const displayDesc = productDescription(product, lang);
  const images = product.images;
  const galleryImages = images;
  const sizeOptions = normalizeSizeOptions(product.sizeOptions);
  const canBuy = isSellableProduct(product);
  const onSale =
    product.isSale ||
    (product.compareAtPriceNum != null &&
      product.compareAtPriceNum > product.priceNum);

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

  useEffect(() => {
    const footer = document.querySelector(".site-foot");
    if (!footer) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setFooterInView(entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  function selectSize(sz: string) {
    setSelectedSize(sz);
    setSizeHint(false);
  }

  function addToCart() {
    if (!canBuy) return;
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
    if (!selectedSize) {
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

  return (
    <>
      <div className="pdp">
        <nav className="pdp-breadcrumb" aria-label="Breadcrumb">
          <Link href={`/${lang}`}>{t.product.home}</Link>
          <span aria-hidden="true">›</span>
          <Link href={`/${lang}/catalog`}>{t.product.catalog}</Link>
          <span aria-hidden="true">›</span>
          <span>{displayName}</span>
        </nav>

        <div className="pdp-layout">
          <div className="pdp-media">
            <ProductGallery
              images={galleryImages}
              alt={displayName}
              prevLabel={t.a11y.prevPhoto}
              nextLabel={t.a11y.nextPhoto}
              closeLabel={t.a11y.close}
            />
          </div>

          <div className="pdp-info">
            <header className="pdp-intro">
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

            <div className="pdp-block pdp-buy-opts">
              <ProductColorPalette product={product} lang={lang} />

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

              {materialOptions.length > 0 && (
                <div
                  className={`pdp-option pdp-option--material${materialOptions.length === 1 ? " is-static" : ""}${materialHint ? " is-hint" : ""}`}
                  ref={materialBlockRef}
                >
                  <div className="pdp-option-top">
                    <p className="pdp-label">{t.product.materialVariant}</p>
                    {(materialOptions.length === 1 || selectedMaterial) && (
                      <p className="pdp-option-value">
                        {materialOptions.length === 1
                          ? materialOptions[0]
                          : selectedMaterial}
                      </p>
                    )}
                  </div>
                  {materialOptions.length > 1 && (
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
                  )}
                  {materialHint && (
                    <p className="pdp-inline-hint" role="status">
                      {t.product.pickMaterial}
                    </p>
                  )}
                </div>
              )}

              <div
                className={`pdp-option pdp-option--size${sizeHint ? " is-hint" : ""}`}
                ref={sizeBlockRef}
              >
                <div className="pdp-option-top">
                  <p className="pdp-label">{t.product.size}</p>
                  <a className="pdp-size-help" href="#pdp-size-chart">
                    {t.product.sizeGuide}
                  </a>
                </div>
                <div
                  className="pdp-sizes"
                  role="listbox"
                  aria-label={t.product.size}
                  aria-invalid={sizeHint}
                >
                  {sizeOptions.map((sz) => (
                    <button
                      key={sz}
                      className={`pdp-size${selectedSize === sz ? " is-active" : ""}`}
                      type="button"
                      role="option"
                      aria-selected={selectedSize === sz}
                      onClick={() => selectSize(sz)}
                    >
                      {sz}
                    </button>
                  ))}
                  <button
                    className={`pdp-size pdp-size--custom${selectedSize === CUSTOM_SIZE_VALUE ? " is-active" : ""}`}
                    type="button"
                    role="option"
                    aria-selected={selectedSize === CUSTOM_SIZE_VALUE}
                    onClick={() => selectSize(CUSTOM_SIZE_VALUE)}
                  >
                    {t.product.sizeCustom}
                  </button>
                </div>
                {sizeHint && (
                  <p className="pdp-inline-hint" role="status">
                    {t.product.pickSize}
                  </p>
                )}
              </div>
            </div>

            <div className="pdp-actions">
              <button
                className="pdp-cart pdp-cart--desktop"
                type="button"
                onClick={addToCart}
                disabled={!canBuy}
              >
                {canBuy ? t.product.addToCart : t.product.outOfStock}
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
            </div>

            {displayDesc && (
              <div className="pdp-block pdp-desc-block">
                <p className="pdp-label">{t.product.description}</p>
                <p className="pdp-desc">{displayDesc}</p>
              </div>
            )}

            {product.material && (
              <div className="pdp-block pdp-fabric">
                <p className="pdp-label">{t.product.fabric}</p>
                <p>{product.material}</p>
              </div>
            )}

            {(product.photoSize || product.modelParams) && (
              <div className="pdp-block">
                <p className="pdp-label">
                  {lang === "uk" ? "Модель" : "Model"}
                </p>
                {product.photoSize && (
                  <p>
                    {lang === "uk" ? "На фото розмір" : "Size on photo"}:{" "}
                    {product.photoSize}
                  </p>
                )}
                {product.modelParams && <p>{product.modelParams}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="pdp-below">
          <section
            className="pdp-size-chart"
            id="pdp-size-chart"
            aria-labelledby="pdp-size-chart-title"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brush-art pdp-size-chart-brush"
              src="/assets/brush-mint.png"
              alt=""
              aria-hidden="true"
            />
            <div className="pdp-size-chart-body">
              <header className="pdp-size-chart-head">
                <h2 id="pdp-size-chart-title">{t.product.sizeChartTitle}</h2>
                <p>{t.product.sizeChartSubtitle}</p>
              </header>
              <div className="pdp-size-chart-scroll">
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
              </div>
              <p className="pdp-size-chart-also">
                <span>{t.product.sizeChartAlso}</span>{" "}
                <strong>{t.product.sizeChartCustom}</strong>
              </p>
            </div>
            <div className="pdp-size-chart-media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="pdp-size-chart-tape"
                src="/assets/measuring-tape.png"
                alt=""
                width={420}
                height={420}
              />
            </div>
          </section>

          <p className="pdp-model-note">{t.product.modelOnPhoto}</p>

          {related.length > 0 && (
            <section className="pdp-related" aria-label={t.product.lookTitle}>
              <div className="pdp-related-head">
                <h2 className="pdp-section-title">{t.product.lookTitle}</h2>
              </div>
              <div className="pdp-related-grid">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} lang={lang} />
                ))}
              </div>
            </section>
          )}

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

      <div
        className={`pdp-mobile-bar${hideMobileBar ? " is-hidden" : ""}`}
        aria-hidden={hideMobileBar}
      >
        <button
          className="pdp-cart"
          type="button"
          onClick={addToCart}
          disabled={!canBuy}
          tabIndex={hideMobileBar ? -1 : undefined}
        >
          {canBuy ? t.product.addToCart : t.product.outOfStock}
        </button>
      </div>
    </>
  );
}
