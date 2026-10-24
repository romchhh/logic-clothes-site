"use client";

import Link from "next/link";
import VariantMeta from "@/components/shared/VariantMeta";
import { useAppContext } from "@/lib/GeneralProvider";
import { useBasket } from "@/lib/BasketProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatMoney } from "@/lib/format";

export default function SidebarBasket() {
  const { t, lang } = useI18n();
  const { isBasketOpen, closePanels, isSearchOpen } = useAppContext();
  const { items, removeItem, updateQuantity, total } = useBasket();
  const backdropOpen = isBasketOpen || isSearchOpen;

  return (
    <>
      <div
        className={`panel-backdrop${backdropOpen ? " open" : ""}`}
        onClick={closePanels}
        aria-hidden={!backdropOpen}
      />
      <aside
        className={`side-panel${isBasketOpen ? " open" : ""}`}
        aria-label={t.basket.title}
      >
        <div className="side-panel-head">
          <h2>{t.basket.title}</h2>
          <button type="button" onClick={closePanels} aria-label={t.a11y.close}>
            ×
          </button>
        </div>
        <div className="side-panel-body">
          {!items.length ? (
            <p className="panel-empty">{t.basket.empty}</p>
          ) : (
            items.map((item) => (
              <div
                className="panel-item panel-item--cart"
                key={`${item.id}-${item.size}`}
              >
                <Link
                  href={`/${lang}/product/${encodeURIComponent(item.id)}`}
                  className="panel-item-link"
                  onClick={closePanels}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt="" width={76} height={96} />
                  <div className="panel-item-body">
                    <p className="panel-item-name">{item.name}</p>
                    <VariantMeta
                      item={item}
                      labels={{
                        size: t.basket.size,
                        length: t.product.length,
                        material: t.product.materialVariant,
                        color: t.product.color,
                      }}
                      className="panel-item-meta variant-meta"
                    />
                    <p className="panel-item-price">
                      {formatMoney(item.priceNum * item.quantity)}
                    </p>
                  </div>
                </Link>
                <div className="panel-item-controls">
                  <div className="panel-qty">
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
                    className="panel-remove"
                    aria-label={t.basket.remove}
                    onClick={() => removeItem(item.id, item.size)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="side-panel-foot side-panel-foot--cart">
          <div className="panel-total">
            <span>{t.basket.total}</span>
            <span>{formatMoney(total)}</span>
          </div>
          {items.length > 0 ? (
            <Link
              href={`/${lang}/final`}
              className="btn-brand"
              onClick={closePanels}
            >
              {t.basket.checkout}
            </Link>
          ) : (
            <button type="button" className="btn-brand" disabled>
              {t.basket.checkout}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
