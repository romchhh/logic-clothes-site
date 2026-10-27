"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatCardPrice } from "@/lib/format";
import { useWishlist } from "@/lib/WishlistProvider";
import { productOnSale } from "@/lib/productCatalogSections";
import { productName, type Product } from "@/lib/types";

export default function ProductCard({
  product,
  lang,
  priority = false,
}: {
  product: Product;
  lang: Locale;
  priority?: boolean;
}) {
  const { t } = useI18n();
  const { isWished, toggleWish } = useWishlist();
  const wished = isWished(product.id);
  const src = product.images[0] || "/assets/hero.png";
  const title = productName(product, lang);
  const onSale = productOnSale(product);

  return (
    <article className="product" data-product-id={product.id}>
      <Link
        href={`/${lang}/product/${encodeURIComponent(product.id)}`}
        className="product-link"
      >
        <div className="product-img">
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 899px) 50vw, (max-width: 1399px) 33vw, 25vw"
            quality={85}
            priority={priority}
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          {(product.isNew ||
            onSale ||
            product.isPopular ||
            product.inStock === false) && (
            <div className="product-badges">
              {product.inStock === false && (
                <span className="product-badge is-oos">
                  {t.product.outOfStock}
                </span>
              )}
              {product.isNew && (
                <span className="product-badge is-new">New</span>
              )}
              {onSale && <span className="product-badge is-sale">Sale</span>}
              {product.isPopular && (
                <span className="product-badge is-new">Popular</span>
              )}
            </div>
          )}
          <button
            className={`wish${wished ? " is-on" : ""}`}
            type="button"
            aria-label={t.a11y.wishAdd}
            aria-pressed={wished}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWish({
                id: product.id,
                name: title,
                price: product.price,
                priceNum: product.priceNum,
                image: src,
              });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20.2l-1.45-1.32C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.55 11.38L12 20.2z" />
            </svg>
          </button>
        </div>
        <div className="product-info">
          <div className="product-name">{title}</div>
          <div className="product-price">
            {onSale && product.compareAtPriceNum != null && (
              <span className="product-price-old">
                {product.compareAtPriceNum.toLocaleString("uk-UA")} грн
              </span>
            )}
            <span>{formatCardPrice(product)}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
