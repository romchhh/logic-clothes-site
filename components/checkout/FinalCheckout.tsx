"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import ProductCard from "@/components/catalog/ProductCard";
import VariantMeta from "@/components/shared/VariantMeta";
import { useBasket } from "@/lib/BasketProvider";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import type { NovaWarehouseKind } from "@/lib/novaPoshtaShared";
import type { DeliveryMethod, Product } from "@/lib/types";
import { useNovaPoshta } from "@/hooks/useNovaPoshta";

const METHODS: DeliveryMethod[] = [
  "nova_poshta_branch",
  "nova_poshta_locker",
  "nova_poshta_courier",
  "pickup",
  "international",
];

function isNovaMethod(method: DeliveryMethod): boolean {
  return method.startsWith("nova_poshta");
}

type CompletedOrder = {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  city: string;
  address: string;
  comment?: string;
  items: {
    name: string;
    size: string;
    sizeLabel?: string;
    length?: string;
    material?: string;
    color?: string;
    quantity: number;
    priceNum: number;
    image: string;
  }[];
  total: number;
};

function warehouseKindFor(
  method: DeliveryMethod
): NovaWarehouseKind | null {
  if (method === "nova_poshta_branch") return "branch";
  if (method === "nova_poshta_locker") return "locker";
  return null;
}

function AlsoLike({
  lang,
  title,
  products,
}: {
  lang: Locale;
  title: string;
  products: Product[];
}) {
  if (!products.length) return null;
  return (
    <section className="checkout-also" aria-labelledby="checkout-also-title">
      <div className="section-head">
        <h2 id="checkout-also-title">{title}</h2>
      </div>
      <div className="home-products-grid">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} lang={lang} />
        ))}
      </div>
    </section>
  );
}

export default function FinalCheckout({
  lang,
  suggested,
}: {
  lang: Locale;
  suggested: Product[];
}) {
  const { t } = useI18n();
  const { items, total, updateQuantity, removeItem, clearBasket } = useBasket();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("nova_poshta_branch");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [cityListOpen, setCityListOpen] = useState(false);
  const [warehouseListOpen, setWarehouseListOpen] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );

  const npEnabled = isNovaMethod(deliveryMethod);
  const warehouseKind = warehouseKindFor(deliveryMethod);
  const needsWarehouse = warehouseKind != null;
  const needsFreeAddress =
    deliveryMethod === "nova_poshta_courier" ||
    deliveryMethod === "international";

  const {
    filteredCities,
    filteredWarehouses,
    loadingCities,
    loadingWarehouses,
  } = useNovaPoshta({
    enabled: npEnabled,
    city,
    address,
    warehouseKind,
  });

  const citySuggestions = useMemo(
    () => filteredCities.slice(0, 12),
    [filteredCities]
  );
  const warehouseSuggestions = useMemo(
    () => filteredWarehouses.slice(0, 12),
    [filteredWarehouses]
  );

  const alsoLike = useMemo(() => {
    const inCart = new Set(items.map((i) => i.id));
    return suggested.filter((p) => !inCart.has(p.id)).slice(0, 8);
  }, [suggested, items]);

  useEffect(() => {
    if (deliveryMethod === "pickup") {
      setCity("Київ");
      setAddress("вул. Софіївська, 5 · Logic Clothes Concept store");
      setCityListOpen(false);
      setWarehouseListOpen(false);
      return;
    }
    setCity("");
    setAddress("");
    setCityListOpen(false);
    setWarehouseListOpen(false);
  }, [deliveryMethod]);

  useEffect(() => {
    if (!done) return;
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [done]);

  function selectCity(value: string) {
    setCity(value);
    setCityListOpen(false);
    if (needsWarehouse) {
      setAddress("");
      setWarehouseListOpen(false);
    }
  }

  function selectWarehouse(value: string) {
    setAddress(value);
    setWarehouseListOpen(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldError(null);

    if (!items.length) {
      setFieldError(t.checkout.errors.empty);
      return;
    }
    if (customerName.trim().length < 2) {
      setFieldError(t.checkout.errors.name);
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setFieldError(t.checkout.errors.phone);
      return;
    }
    if (!city.trim()) {
      setFieldError(t.checkout.errors.city);
      return;
    }
    if (!address.trim()) {
      setFieldError(t.checkout.errors.address);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          deliveryMethod,
          city: city.trim(),
          address: address.trim(),
          comment: comment.trim() || undefined,
          locale: lang,
          items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            size: item.size,
            sizeLabel: item.sizeLabel,
            length: item.length,
            material: item.material,
            color: item.color,
            quantity: item.quantity,
            priceNum: item.priceNum,
          })),
        }),
      });

      if (!res.ok) {
        setFieldError(t.checkout.errors.generic);
        return;
      }

      const data = (await res.json()) as { orderId?: string };
      const orderTotal = items.reduce(
        (sum, item) => sum + item.priceNum * item.quantity,
        0
      );
      setCompletedOrder({
        orderId: data.orderId ?? "LC",
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        deliveryMethod,
        city: city.trim(),
        address: address.trim(),
        comment: comment.trim() || undefined,
        items: items.map((item) => ({
          name: item.name,
          size: item.size,
          sizeLabel: item.sizeLabel,
          length: item.length,
          material: item.material,
          color: item.color,
          quantity: item.quantity,
          priceNum: item.priceNum,
          image: item.image,
        })),
        total: orderTotal,
      });
      clearBasket();
      setDone(true);
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch {
      setFieldError(t.checkout.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  const variantLabels = {
    size: t.basket.size,
    length: t.product.length,
    material: t.product.materialVariant,
    color: t.product.color,
  };

  if (done && completedOrder) {
    const deliveryLabel = t.checkout.methods[completedOrder.deliveryMethod];
    return (
      <section className="checkout-page checkout-page--success">
        <div className="checkout-success-card">
          <div className="checkout-success-hero">
            <div className="checkout-success-mark" aria-hidden="true">✓</div>
            <h1 className="checkout-title">{t.checkout.successTitle}</h1>
            <p className="checkout-lead checkout-lead--center">
              {t.checkout.successText}
            </p>
            <p className="checkout-success-id">
              <span>{t.checkout.successOrderId}</span>
              <strong>{completedOrder.orderId}</strong>
            </p>
          </div>

          <div className="checkout-receipt">
            <h2 className="checkout-receipt-title">{t.checkout.successDetails}</h2>
            <dl className="checkout-receipt-meta">
              <div>
                <dt>{t.checkout.name}</dt>
                <dd>{completedOrder.customerName}</dd>
              </div>
              <div>
                <dt>{t.checkout.phone}</dt>
                <dd>{completedOrder.phone}</dd>
              </div>
              {completedOrder.email && (
                <div>
                  <dt>{t.checkout.email}</dt>
                  <dd>{completedOrder.email}</dd>
                </div>
              )}
              <div>
                <dt>{t.checkout.delivery}</dt>
                <dd>
                  {deliveryLabel}
                  <br />
                  {completedOrder.city}
                  <br />
                  {completedOrder.address}
                </dd>
              </div>
              {completedOrder.comment && (
                <div>
                  <dt>{t.checkout.comment}</dt>
                  <dd>{completedOrder.comment}</dd>
                </div>
              )}
            </dl>

            <ul className="checkout-receipt-items">
              {completedOrder.items.map((item) => (
                <li key={`${item.name}-${item.size}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" width={72} height={90} />
                  <div className="checkout-item-body">
                    <p className="checkout-item-name">{item.name}</p>
                    <VariantMeta
                      item={item}
                      labels={variantLabels}
                      className="checkout-item-meta variant-meta"
                    />
                    <p className="checkout-item-meta">×{item.quantity}</p>
                  </div>
                  <p className="checkout-item-price">
                    {formatMoney(item.priceNum * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="checkout-total checkout-total--receipt">
              <span>{t.basket.total}</span>
              <span>{formatMoney(completedOrder.total)}</span>
            </div>
          </div>

          <p className="checkout-success-followup">{t.checkout.successFollowUp}</p>

          <Link href={`/${lang}`} className="btn-brand checkout-cta">
            {t.checkout.successCta}
          </Link>
        </div>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="checkout-page">
        <div className="checkout-empty">
          <h1 className="checkout-title">{t.checkout.emptyTitle}</h1>
          <Link href={`/${lang}/catalog`} className="btn-brand checkout-cta">
            {t.checkout.emptyCta}
          </Link>
        </div>
        <AlsoLike
          lang={lang}
          title={t.checkout.alsoLike}
          products={suggested.slice(0, 8)}
        />
      </section>
    );
  }

  const pickupLocked = deliveryMethod === "pickup";
  const positionCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <section className="checkout-page">
      <header className="checkout-head">
        <h1 className="checkout-title">{t.checkout.title}</h1>
        <p className="checkout-lead">{t.checkout.subtitle}</p>
      </header>

      <div className="checkout-layout">
        <aside
          className="checkout-summary"
          aria-label={t.checkout.orderSummary}
        >
          <div className="checkout-summary-card">
            <div className="checkout-summary-head">
              <h2>{t.checkout.orderSummary}</h2>
              <p className="checkout-summary-meta">
                {positionCount} {t.checkout.summaryPositions}
              </p>
            </div>
            <ul className="checkout-items">
              {items.map((item) => (
                <li key={`${item.id}-${item.size}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" width={72} height={90} />
                  <div className="checkout-item-body">
                    <p className="checkout-item-name">{item.name}</p>
                    <VariantMeta
                      item={item}
                      labels={variantLabels}
                      className="checkout-item-meta variant-meta"
                    />
                    <div className="checkout-qty">
                      <button
                        type="button"
                        aria-label="−"
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="+"
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="checkout-item-side">
                    <p className="checkout-item-price">
                      {formatMoney(item.priceNum * item.quantity)}
                    </p>
                    <button
                      type="button"
                      className="checkout-item-remove"
                      aria-label={t.basket.remove}
                      onClick={() => removeItem(item.id, item.size)}
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="checkout-total">
              <span>{t.basket.total}</span>
              <span>{formatMoney(total)}</span>
            </div>
            {fieldError && (
              <p className="checkout-error checkout-error--summary">{fieldError}</p>
            )}
            <button
              type="submit"
              form="checkout-form"
              className="btn-brand checkout-submit"
              disabled={loading}
            >
              {loading ? t.checkout.submitting : t.checkout.submit}
            </button>
            <p className="checkout-trust">{t.checkout.managerNote}</p>
            <Link href={`/${lang}/catalog`} className="checkout-back">
              {t.checkout.backToShop}
            </Link>
          </div>
        </aside>

        <form
          id="checkout-form"
          className="checkout-form"
          onSubmit={onSubmit}
          noValidate
        >
          <fieldset className="checkout-panel">
            <legend className="checkout-panel-title">
              <span className="checkout-step" aria-hidden="true">1</span>
              {t.checkout.contact}
            </legend>
            <label className="checkout-field">
              <span>{t.checkout.name}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                placeholder={t.checkout.namePlaceholder}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </label>
            <div className="checkout-row">
              <label className="checkout-field">
                <span>{t.checkout.phone}</span>
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  placeholder="+380…"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>
                  {t.checkout.email}{" "}
                  <em className="checkout-optional">
                    ({t.checkout.emailOptional})
                  </em>
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="checkout-panel">
            <legend className="checkout-panel-title">
              <span className="checkout-step" aria-hidden="true">2</span>
              {t.checkout.delivery}
            </legend>
            <label className="checkout-field checkout-field--select">
              <span>{t.checkout.deliveryMethod}</span>
              <select
                name="deliveryMethod"
                value={deliveryMethod}
                onChange={(e) =>
                  setDeliveryMethod(e.target.value as DeliveryMethod)
                }
              >
                {METHODS.map((method) => (
                  <option key={method} value={method}>
                    {t.checkout.methods[method]}
                  </option>
                ))}
              </select>
            </label>

            <div
              className={`checkout-address${npEnabled || needsFreeAddress || pickupLocked ? " is-open" : ""}`}
            >
            <div className="checkout-autocomplete">
              <label className="checkout-field">
                <span>{t.checkout.city}</span>
                <input
                  type="text"
                  name="city"
                  autoComplete="off"
                  placeholder={
                    npEnabled ? t.checkout.cityPlaceholder : undefined
                  }
                  value={city}
                  disabled={pickupLocked}
                  onChange={(e) => {
                    setCity(e.target.value);
                    if (npEnabled) setCityListOpen(true);
                  }}
                  onFocus={() => {
                    if (npEnabled) setCityListOpen(true);
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setCityListOpen(false), 150);
                  }}
                  required
                />
              </label>
              {npEnabled && cityListOpen && (
                <ul className="checkout-suggest" role="listbox">
                  {loadingCities && (
                    <li className="checkout-suggest-meta">
                      {t.checkout.cityLoading}
                    </li>
                  )}
                  {!loadingCities &&
                    citySuggestions.map((option) => (
                      <li key={option}>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCity(option)}
                        >
                          {option}
                        </button>
                      </li>
                    ))}
                  {!loadingCities && !citySuggestions.length && city.trim() && (
                    <li className="checkout-suggest-meta">—</li>
                  )}
                </ul>
              )}
            </div>

            {needsWarehouse && (
              <div className="checkout-autocomplete">
                <label className="checkout-field">
                  <span>{t.checkout.warehouse}</span>
                  <input
                    type="text"
                    name="warehouse"
                    autoComplete="off"
                    placeholder={t.checkout.warehousePlaceholder}
                    value={address}
                    disabled={!city.trim()}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setWarehouseListOpen(true);
                    }}
                    onFocus={() => setWarehouseListOpen(true)}
                    onBlur={() => {
                      window.setTimeout(
                        () => setWarehouseListOpen(false),
                        150
                      );
                    }}
                    required
                  />
                  <small className="checkout-hint">
                    {t.checkout.addressHint}
                  </small>
                </label>
                {warehouseListOpen && city.trim() && (
                  <ul className="checkout-suggest" role="listbox">
                    {loadingWarehouses && (
                      <li className="checkout-suggest-meta">
                        {t.checkout.warehouseLoading}
                      </li>
                    )}
                    {!loadingWarehouses &&
                      warehouseSuggestions.map((option) => (
                        <li key={option}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectWarehouse(option)}
                          >
                            {option}
                          </button>
                        </li>
                      ))}
                    {!loadingWarehouses &&
                      !warehouseSuggestions.length &&
                      address.trim() && (
                        <li className="checkout-suggest-meta">—</li>
                      )}
                  </ul>
                )}
              </div>
            )}

            {(needsFreeAddress || pickupLocked) && (
              <label className="checkout-field">
                <span>
                  {needsFreeAddress
                    ? t.checkout.courierAddress
                    : t.checkout.address}
                </span>
                <input
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  placeholder={
                    needsFreeAddress
                      ? t.checkout.courierAddressPlaceholder
                      : undefined
                  }
                  value={address}
                  disabled={pickupLocked}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="checkout-field checkout-field--comment">
              <span>{t.checkout.comment}</span>
              <textarea
                name="comment"
                rows={3}
                placeholder={t.checkout.commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            </div>
          </fieldset>

          {fieldError && (
            <p className="checkout-error checkout-error--form">{fieldError}</p>
          )}

          <div className="checkout-actions checkout-actions--mobile">
            <button type="submit" className="btn-brand" disabled={loading}>
              {loading ? t.checkout.submitting : t.checkout.submit}
            </button>
            <p className="checkout-trust checkout-trust--mobile">
              {t.checkout.managerNote}
            </p>
            <Link href={`/${lang}/catalog`} className="checkout-back">
              {t.checkout.backToShop}
            </Link>
          </div>
        </form>
      </div>

      <AlsoLike lang={lang} title={t.checkout.alsoLike} products={alsoLike} />
    </section>
  );
}
