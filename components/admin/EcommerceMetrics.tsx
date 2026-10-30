"use client";

import React from "react";
import Link from "next/link";
import { useAdminStats } from "@/lib/useAdminStats";
import { formatAdminMoney } from "@/lib/adminOrderStatus";

type MetricProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
};

function Metric({ label, value, hint, href }: MetricProps) {
  const inner = (
    <>
      <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <div className="admin-metric-value mt-1.5 text-[22px] font-semibold tracking-tight text-gray-900 tabular-nums sm:mt-2 sm:text-[28px] dark:text-white">
        {value}
      </div>
      {hint && (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      )}
    </>
  );

  const className =
    "admin-panel block p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#B7E1DF]/80 hover:shadow-[0_12px_28px_-16px_rgba(16,24,40,0.25)] dark:hover:border-[#B7E1DF]/30 dark:hover:shadow-none sm:p-5 md:p-6";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

export const EcommerceMetrics = () => {
  const { stats, loading, error } = useAdminStats();
  const dash = loading ? "…" : "—";
  const val = (n: number | undefined) =>
    stats && typeof n === "number" ? n.toLocaleString("uk-UA") : dash;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4 md:gap-4">
        <Metric
          label="Замовлення"
          value={val(stats?.orders)}
          hint={stats ? `Нових: ${stats.newOrders}` : undefined}
          href="/admin/orders"
        />
        <Metric
          label="Товари"
          value={val(stats?.products)}
          hint={stats ? `В наявності: ${stats.inStock}` : undefined}
          href="/admin/products"
        />
        <Metric
          label="Нові замовлення"
          value={val(stats?.newOrders)}
          href="/admin/orders"
        />
        <Metric
          label="Виручка"
          value={stats ? formatAdminMoney(stats.revenue) : dash}
          hint="Без скасованих"
        />
      </div>
    </div>
  );
};
