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
import type { DeliveryMethod, PaymentType, Product } from "@/lib/types";
import { useNovaPoshta } from "@/hooks/useNovaPoshta";
import { PREPAY_AMOUNT_UAH } from "@/lib/paymentConstants";

const METHODS: DeliveryMethod[] = [
  "nova_poshta_branch",
  "nova_poshta_locker",
  "nova_poshta_courier",
  "pickup",
  "international",
];

const PAYMENT_METHODS: PaymentType[] = ["full", "prepay", "pay_after"];

const PENDING_ORDER_KEY = "lc_pending_order";

function submitWayForPayForm(
  paymentUrl: string,
  paymentData: Record<string, string | number | string[] | number[]>
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.acceptCharset = "utf-8";
  Object.entries(paymentData).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = `${key}[${index}]`;
        input.value = String(item);
        form.appendChild(input);
      });
    } else {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value);
      form.appendChild(input);
    }
  });
  document.body.appendChild(form);
  form.submit();
}

function isNovaMethod(method: DeliveryMethod): boolean {
  return method.startsWith("nova_poshta");
}

type CompletedOrder = {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  paymentType: PaymentType;
  paidOnline?: boolean;
  city: string;
  address: string;
  comment?: string;
  items: {
    productId?: string;
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
  amountToPay?: number;
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
      <div className="checkout-also-inner">
        <div className="section-head">
          <h2 id="checkout-also-title">{title}</h2>
        </div>
        <div className="products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FinalCheckout({
  lang,
  suggested,
  returnOrderId,
  returnPaid,
}: {
  lang: Locale;
  suggested: Product[];
  returnOrderId?: string | null;
  returnPaid?: boolean;
}) {
  const { t } = useI18n();
  const { items, total, updateQuantity, removeItem, clearBasket } = useBasket();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("nova_poshta_branch");
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [cityListOpen, setCityListOpen] = useState(false);
  const [warehouseListOpen, setWarehouseListOpen] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [bagOpen, setBagOpen] = useState(true);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null
  );

  useEffect(() => {
    if (!returnOrderId) return;
    try {
      const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
      if (raw) {
        const pending = JSON.parse(raw) as CompletedOrder;
        if (pending.orderId === returnOrderId) {
          setCompletedOrder({
            ...pending,
            paidOnline: Boolean(returnPaid) || pending.paymentType !== "pay_after",
          });
          setDone(true);
          clearBasket();
          sessionStorage.removeItem(PENDING_ORDER_KEY);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setCompletedOrder({
      orderId: returnOrderId,
      customerName: "",
      phone: "",
      deliveryMethod: "nova_poshta_branch",
      paymentType: "full",
      paidOnline: Boolean(returnPaid),
      city: "",
      address: "",
      items: [],
      total: 0,
    });
    setDone(true);
    clearBasket();
  }, [returnOrderId, returnPaid, clearBasket]);

  const amountDueNow = useMemo(() => {
    if (paymentType === "prepay") return PREPAY_AMOUNT_UAH;
    if (paymentType === "pay_after") return 0;
    return total;
  }, [paymentType, total]);

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
    if (!paymentType) {
      setFieldError(t.checkout.errors.payment);
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
          paymentType,
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

      const data = (await res.json().catch(() => ({}))) as {
        orderId?: string;
        requiresPayment?: boolean;
        paymentUrl?: string;
        paymentData?: Record<string, string | number | string[] | number[]>;
        amountToPay?: number;
        error?: string;
      };

      if (!res.ok) {
        setFieldError(
          data.error === "payment_config"
            ? t.checkout.errors.generic
            : t.checkout.errors.generic
        );
        return;
      }

      const orderTotal = items.reduce(
        (sum, item) => sum + item.priceNum * item.quantity,
        0
      );
      const completed: CompletedOrder = {
        orderId: data.orderId ?? "LC",
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        deliveryMethod,
        paymentType,
        paidOnline: false,
        city: city.trim(),
        address: address.trim(),
        comment: comment.trim() || undefined,
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
          image: item.image,
        })),
        total: orderTotal,
        amountToPay: data.amountToPay,
      };

      if (data.requiresPayment && data.paymentUrl && data.paymentData) {
        try {
          sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(completed));
        } catch {
          /* ignore */
        }
        setFieldError(null);
        submitWayForPayForm(data.paymentUrl, data.paymentData);
        return;
      }

      setCompletedOrder(completed);
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
    const paymentLabel =
      t.checkout.paymentTypes[completedOrder.paymentType] ||
      completedOrder.paymentType;
    return (
      <section className="checkout-page checkout-page--success">
        <div className="checkout-success-card">
          <div className="checkout-success-hero">
            <div className="checkout-success-mark" aria-hidden="true">✓</div>
            <h1 className="checkout-title">{t.checkout.successTitle}</h1>
            <p className="checkout-lead checkout-lead--center">
              {completedOrder.paidOnline
                ? t.checkout.successPaidText
                : t.checkout.successText}
            </p>
            <p className="checkout-success-id">
              <span>{t.checkout.successOrderId}</span>
              <strong>{completedOrder.orderId}</strong>
            </p>
          </div>

          <div className="checkout-receipt">
            <h2 className="checkout-receipt-title">{t.checkout.successDetails}</h2>
            <dl className="checkout-receipt-meta">
              {completedOrder.customerName ? (
                <div>
                  <dt>{t.checkout.name}</dt>
                  <dd>{completedOrder.customerName}</dd>
                </div>
              ) : null}
              {completedOrder.phone ? (
                <div>
                  <dt>{t.checkout.phone}</dt>
                  <dd>{completedOrder.phone}</dd>
                </div>
              ) : null}
              {completedOrder.email && (
                <div>
                  <dt>{t.checkout.email}</dt>
                  <dd>{completedOrder.email}</dd>
                </div>
              )}
              {completedOrder.city ? (
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
              ) : null}
              <div>
                <dt>{t.checkout.payment}</dt>
                <dd>{paymentLabel}</dd>
              </div>
              {completedOrder.comment && (
                <div>
                  <dt>{t.checkout.comment}</dt>
                  <dd>{completedOrder.comment}</dd>
                </div>
              )}
            </dl>

            <ul className="checkout-receipt-items">
              {completedOrder.items.map((item) => {
                const href = item.productId
                  ? `/${lang}/product/${encodeURIComponent(item.productId)}`
                  : null;
                const media = (
                  <>
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
                  </>
                );
                return (
                  <li key={`${item.productId || item.name}-${item.size}`}>
                    {href ? (
                      <Link href={href} className="checkout-item-link">
                        {media}
                      </Link>
                    ) : (
                      media
                    )}
                    <p className="checkout-item-price">
                      {formatMoney(item.priceNum * item.quantity)}
                    </p>
                  </li>
                );
              })}
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
      <section className="checkout-page checkout-page--empty">
        <div className="checkout-empty">
          <p className="checkout-eyebrow">Logic Clothes</p>
          <h1 className="checkout-title">{t.checkout.emptyTitle}</h1>
          <p className="checkout-lead checkout-lead--center">
            {t.checkout.subtitle}
          </p>
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
  const ctaLabel = loading
    ? paymentType === "pay_after"
      ? t.checkout.submitting
      : t.checkout.redirectingPay
    : paymentType === "pay_after"
      ? t.checkout.submit
      : t.checkout.payNow;

  const summaryBody = (
    <>
      <ul className="checkout-items">
        {items.map((item) => (
          <li key={`${item.id}-${item.size}`}>
            <Link
              href={`/${lang}/product/${encodeURIComponent(item.id)}`}
              className="checkout-item-link"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" width={72} height={90} />
              <div className="checkout-item-body">
                <p className="checkout-item-name">{item.name}</p>
                <VariantMeta
                  item={item}
                  labels={variantLabels}
                  className="checkout-item-meta variant-meta"
                />
              </div>
            </Link>
            <div className="checkout-item-side">
              <p className="checkout-item-price">
                {formatMoney(item.priceNum * item.quantity)}
              </p>
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
      <div className="checkout-totals">
        <div className="checkout-total">
          <span>{t.basket.total}</span>
          <span>{formatMoney(total)}</span>
        </div>
        {amountDueNow > 0 && amountDueNow !== total ? (
          <div className="checkout-total checkout-total--due">
            <span>{t.checkout.amountDue}</span>
            <span>{formatMoney(amountDueNow)}</span>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <section className="checkout-page">
      <header className="checkout-head">
        <p className="checkout-eyebrow">Logic Clothes</p>
        <h1 className="checkout-title">{t.checkout.title}</h1>
        <p className="checkout-lead">{t.checkout.subtitle}</p>
        <ol className="checkout-progress" aria-label={t.checkout.title}>
          <li className="is-active">
            <span>1</span>
            {t.checkout.contact}
          </li>
          <li>
            <span>2</span>
            {t.checkout.delivery}
          </li>
          <li>
            <span>3</span>
            {t.checkout.payment}
          </li>
        </ol>
      </header>

      <div className="checkout-layout">
        <aside
          className="checkout-summary"
          aria-label={t.checkout.orderSummary}
        >
          <div className="checkout-summary-card">
            <button
              type="button"
              className={`checkout-bag-toggle${bagOpen ? " is-open" : ""}`}
              onClick={() => setBagOpen((v) => !v)}
              aria-expanded={bagOpen}
            >
              <span>
                {t.checkout.bagToggle}
                <em>
                  {positionCount} · {formatMoney(total)}
                </em>
              </span>
              <span className="checkout-bag-chevron" aria-hidden="true" />
            </button>

            <div
              className={`checkout-summary-body${bagOpen ? " is-open" : ""}`}
            >
              <div className="checkout-summary-head checkout-summary-head--desk">
                <h2>{t.checkout.orderSummary}</h2>
                <p className="checkout-summary-meta">
                  {positionCount} {t.checkout.summaryPositions}
                </p>
              </div>
              {summaryBody}
              {amountDueNow > 0 && amountDueNow !== total ? (
                <p className="checkout-due-note">
                  {t.checkout.amountDue}:{" "}
                  <strong>{formatMoney(amountDueNow)}</strong>
                </p>
              ) : null}
              {fieldError && (
                <p className="checkout-error checkout-error--summary">
                  {fieldError}
                </p>
              )}
              <button
                type="submit"
                form="checkout-form"
                className="btn-brand checkout-submit"
                disabled={loading}
              >
                {ctaLabel}
              </button>
              <p className="checkout-trust">{t.checkout.managerNote}</p>
              <Link href={`/${lang}/catalog`} className="checkout-back">
                {t.checkout.backToShop}
              </Link>
            </div>
          </div>
        </aside>

        <form
          id="checkout-form"
          className="checkout-form"
          onSubmit={onSubmit}
          noValidate
        >
          <fieldset className="checkout-panel" id="checkout-step-contact">
            <legend className="checkout-panel-title">
              <span className="checkout-step" aria-hidden="true">
                1
              </span>
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
                  inputMode="tel"
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

          <fieldset className="checkout-panel" id="checkout-step-delivery">
            <legend className="checkout-panel-title">
              <span className="checkout-step" aria-hidden="true">
                2
              </span>
              {t.checkout.delivery}
            </legend>

            <div
              className="checkout-choice-grid"
              role="radiogroup"
              aria-label={t.checkout.deliveryMethod}
            >
              {METHODS.map((method) => (
                <label
                  key={method}
                  className={`checkout-choice${deliveryMethod === method ? " is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value={method}
                    checked={deliveryMethod === method}
                    onChange={() => setDeliveryMethod(method)}
                  />
                  <span className="checkout-choice-title">
                    {t.checkout.methods[method]}
                  </span>
                  <span className="checkout-choice-hint">
                    {t.checkout.methodHints[method]}
                  </span>
                </label>
              ))}
            </div>

            <div className="checkout-address is-open">
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
                    {!loadingCities &&
                      !citySuggestions.length &&
                      city.trim() && (
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
                <span>
                  {t.checkout.comment}{" "}
                  <em className="checkout-optional">
                    ({t.checkout.commentOptional})
                  </em>
                </span>
                <textarea
                  name="comment"
                  rows={2}
                  placeholder={t.checkout.commentPlaceholder}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="checkout-panel" id="checkout-step-payment">
            <legend className="checkout-panel-title">
              <span className="checkout-step" aria-hidden="true">
                3
              </span>
              {t.checkout.payment}
            </legend>

            <div
              className="checkout-choice-grid checkout-choice-grid--pay"
              role="radiogroup"
              aria-label={t.checkout.paymentMethod}
            >
              {PAYMENT_METHODS.map((method) => {
                const due =
                  method === "prepay"
                    ? PREPAY_AMOUNT_UAH
                    : method === "full"
                      ? total
                      : 0;
                return (
                  <label
                    key={method}
                    className={`checkout-choice${paymentType === method ? " is-active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="paymentType"
                      value={method}
                      checked={paymentType === method}
                      onChange={() => setPaymentType(method)}
                    />
                    <span className="checkout-choice-title">
                      {t.checkout.paymentTypes[method]}
                    </span>
                    <span className="checkout-choice-hint">
                      {t.checkout.paymentHints[method]}
                    </span>
                    {due > 0 ? (
                      <span className="checkout-choice-amount">
                        {formatMoney(due)}
                      </span>
                    ) : (
                      <span className="checkout-choice-amount checkout-choice-amount--muted">
                        0 ₴
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            <p className="checkout-hint checkout-hint--block">
              {t.checkout.paymentHint}
            </p>
          </fieldset>

          {fieldError && (
            <p className="checkout-error checkout-error--form">{fieldError}</p>
          )}

          <div className="checkout-actions checkout-actions--inline">
            <button type="submit" className="btn-brand" disabled={loading}>
              {ctaLabel}
            </button>
            <p className="checkout-trust checkout-trust--inline">
              {t.checkout.managerNote}
            </p>
            <Link href={`/${lang}/catalog`} className="checkout-back">
              {t.checkout.backToShop}
            </Link>
          </div>
        </form>
      </div>

      <div className="checkout-sticky-bar" aria-hidden={false}>
        <div className="checkout-sticky-meta">
          <span>{formatMoney(amountDueNow > 0 ? amountDueNow : total)}</span>
          <small>
            {amountDueNow > 0 && amountDueNow !== total
              ? t.checkout.amountDue
              : t.basket.total}
          </small>
        </div>
        <button
          type="submit"
          form="checkout-form"
          className="btn-brand"
          disabled={loading}
        >
          {ctaLabel}
        </button>
      </div>

      <AlsoLike lang={lang} title={t.checkout.alsoLike} products={alsoLike} />
    </section>
  );
}
