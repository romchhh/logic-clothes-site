"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { SIZE_CHART_ROWS } from "@/lib/sizeChart";

type Props = {
  id?: string;
  className?: string;
  /** Extra actions in the same row (e.g. sew CTA on PDP). */
  children?: ReactNode;
};

export default function ProductSizeChartDisclosure({
  id = "pdp-size-chart",
  className = "",
  children,
}: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className={className}>
      <div className="pdp-size-actions">
        <button
          type="button"
          className="pdp-disclosure pdp-size-actions-chart"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? t.product.closeSizeChart : t.product.openSizeChart}
        </button>
        {children}
      </div>
      {open ? (
        <div className="pdp-size-chart pdp-size-chart--inline" id={id}>
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
            onClick={() => setOpen(false)}
          >
            {t.product.closeSizeChart}
          </button>
        </div>
      ) : null}
    </div>
  );
}