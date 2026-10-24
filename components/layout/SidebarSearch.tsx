"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppContext } from "@/lib/GeneralProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n/config";
import { formatCardPrice } from "@/lib/format";
import { useProducts } from "@/lib/useProducts";

export default function SidebarSearch({ lang }: { lang: Locale }) {
  const { t } = useI18n();
  const { isSearchOpen, closePanels } = useAppContext();
  const { products, loading } = useProducts();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter((p) => {
        const name = p.name.toLowerCase();
        const nameEn = (p.nameEn || "").toLowerCase();
        return (
          name.includes(q) ||
          nameEn.includes(q) ||
          String(p.sku).toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [products, query]);

  return (
    <aside
      className={`side-panel${isSearchOpen ? " open" : ""}`}
      aria-label={t.search.title}
    >
      <div className="side-panel-head">
        <h2>{t.search.title}</h2>
        <button type="button" onClick={closePanels} aria-label={t.search.close}>
          ×
        </button>
      </div>
      <div className="side-panel-body" style={{ paddingTop: 8 }}>
        <input
          type="search"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search.placeholder}
          autoFocus={isSearchOpen}
        />
        {loading && <p className="panel-empty">…</p>}
        {!loading && !results.length && (
          <p className="panel-empty">{t.search.empty}</p>
        )}
        {results.map((p) => (
          <Link
            key={p.id}
            href={`/${lang}/product/${encodeURIComponent(p.id)}`}
            className="panel-item panel-item--search"
            onClick={closePanels}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.images[0]} alt="" width={56} height={70} />
            <div className="panel-item-body">
              <p className="panel-item-name">{p.name}</p>
              <p className="panel-item-meta">{formatCardPrice(p)}</p>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
