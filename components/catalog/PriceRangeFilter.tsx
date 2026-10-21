"use client";

import { useMemo } from "react";
import { formatMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function PriceRangeFilter({
  bounds,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
}: {
  bounds: { min: number; max: number };
  minPrice: number | null;
  maxPrice: number | null;
  setMinPrice: (v: number | null) => void;
  setMaxPrice: (v: number | null) => void;
}) {
  const { t } = useI18n();
  const floor = bounds.min;
  const ceiling = bounds.max;

  const step = useMemo(() => {
    const span = Math.max(ceiling - floor, 1);
    if (span <= 500) return 10;
    if (span <= 2000) return 50;
    if (span <= 10000) return 100;
    return 250;
  }, [floor, ceiling]);

  if (ceiling <= floor) {
    return (
      <p className="filter-range-static">{formatMoney(floor)}</p>
    );
  }

  const lo = minPrice ?? floor;
  const hi = maxPrice ?? ceiling;
  const span = ceiling - floor;
  const fillLeft = ((lo - floor) / span) * 100;
  const fillWidth = ((hi - lo) / span) * 100;

  function onMinChange(raw: number) {
    const next = Math.min(Math.max(raw, floor), hi);
    setMinPrice(next <= floor ? null : next);
  }

  function onMaxChange(raw: number) {
    const next = Math.max(Math.min(raw, ceiling), lo);
    setMaxPrice(next >= ceiling ? null : next);
  }

  return (
    <div className="filter-range">
      <div className="filter-range-values">
        <span>
          {t.catalog.minPrice}{" "}
          <strong>{formatMoney(lo)}</strong>
        </span>
        <span>
          {t.catalog.maxPrice}{" "}
          <strong>{formatMoney(hi)}</strong>
        </span>
      </div>
      <div className="filter-range-track-wrap">
        <div className="filter-range-track" aria-hidden="true" />
        <div
          className="filter-range-fill"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
          aria-hidden="true"
        />
        <input
          type="range"
          className="filter-range-input filter-range-input--min"
          min={floor}
          max={ceiling}
          step={step}
          value={lo}
          aria-label={t.catalog.minPrice}
          onChange={(e) => onMinChange(Number(e.target.value))}
        />
        <input
          type="range"
          className="filter-range-input filter-range-input--max"
          min={floor}
          max={ceiling}
          step={step}
          value={hi}
          aria-label={t.catalog.maxPrice}
          onChange={(e) => onMaxChange(Number(e.target.value))}
        />
      </div>
      <div className="filter-range-bounds" aria-hidden="true">
        <span>{formatMoney(floor)}</span>
        <span>{formatMoney(ceiling)}</span>
      </div>
    </div>
  );
}
