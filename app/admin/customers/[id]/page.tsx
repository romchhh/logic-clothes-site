"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ComponentCard from "@/components/admin/ComponentCard";
import Badge from "@/components/admin/ui/badge/Badge";
import type { CustomerDetail } from "@/lib/adminCustomers";
import {
  deliveryLabel,
  formatAdminDate,
  formatAdminMoney,
  orderStatusBadgeColor,
  orderStatusLabel,
} from "@/lib/adminOrderStatus";
import { variantLines } from "@/lib/orderVariant";

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-sm text-gray-800 dark:text-white/90">
        {value || "—"}
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id ? decodeURIComponent(String(params.id)) : "";

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/customers/${encodeURIComponent(customerId)}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as CustomerDetail;
        if (!cancelled) setCustomer(data);
      } catch (e) {
        console.error("Error loading customer:", e);
        if (!cancelled) {
          setError("Не вдалося завантажити клієнта");
          setCustomer(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <div>
      <AdminPageHeader
        title={customer?.name || "Клієнт"}
        description="Картка клієнта, контакти та всі замовлення."
        crumbs={[
          { label: "Клієнти", href: "/admin/customers" },
          { label: customer?.phoneDisplay || customerId },
        ]}
      />

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500 dark:border-white/[0.05] dark:bg-white/[0.03]">
          Завантаження...
        </div>
      ) : !customer ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error || "Клієнта не знайдено"}
          </div>
          <Link
            href="/admin/customers"
            className="text-sm text-brand-500 underline"
          >
            ← До списку клієнтів
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <ComponentCard title="Контакти">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Row label="Імʼя" value={customer.name} />
              <Row
                label="Телефон"
                value={
                  <a href={`tel:${customer.phone}`} className="hover:underline">
                    {customer.phoneDisplay}
                  </a>
                }
              />
              <Row
                label="Email"
                value={
                  customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:underline"
                    >
                      {customer.email}
                    </a>
                  ) : undefined
                }
              />
              <Row label="Місто" value={customer.city} />
              <Row
                label="Мови"
                value={
                  customer.locales.length
                    ? customer.locales.map((l) => l.toUpperCase()).join(", ")
                    : undefined
                }
              />
              <Row
                label="У базі з"
                value={formatAdminDate(customer.firstOrderAt)}
              />
            </div>
            {customer.names.length > 1 && (
              <p className="mt-4 text-sm text-gray-500">
                Інші імена в замовленнях: {customer.names.join(", ")}
              </p>
            )}
            {customer.emails.length > 1 && (
              <p className="mt-1 text-sm text-gray-500">
                Інші email: {customer.emails.join(", ")}
              </p>
            )}
          </ComponentCard>

          <ComponentCard title="Підсумок">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Row label="Замовлень" value={String(customer.orderCount)} />
              <Row
                label="Активних"
                value={String(customer.activeOrderCount)}
              />
              <Row
                label="Сума покупок"
                value={formatAdminMoney(customer.totalSpent)}
              />
              <Row
                label="Останнє замовлення"
                value={formatAdminDate(customer.lastOrderAt)}
              />
            </div>
          </ComponentCard>

          {customer.addresses.length > 0 && (
            <ComponentCard title="Адреси доставки">
              <ul className="space-y-3">
                {customer.addresses.map((addr) => (
                  <li
                    key={`${addr.deliveryMethod}-${addr.city}-${addr.address}`}
                    className="rounded-xl border border-gray-100 px-4 py-3 dark:border-white/[0.06]"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {deliveryLabel(String(addr.deliveryMethod))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {[addr.city, addr.address].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {addr.orderCount}× · востаннє{" "}
                      {formatAdminDate(addr.lastUsedAt)}
                    </div>
                  </li>
                ))}
              </ul>
            </ComponentCard>
          )}

          <ComponentCard title={`Замовлення (${customer.orders.length})`}>
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-gray-100 p-4 dark:border-white/[0.06]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/admin/orders/${encodeURIComponent(order.id)}/edit`}
                        className="font-medium text-gray-900 hover:underline dark:text-white"
                      >
                        {order.id}
                      </Link>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatAdminDate(order.createdAt)} ·{" "}
                        {deliveryLabel(order.deliveryMethod)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color={orderStatusBadgeColor(order.status)}>
                        {orderStatusLabel(order.status)}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatAdminMoney(order.total)}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-2 border-t border-gray-50 pt-3 dark:border-white/[0.04]">
                    {(order.items ?? []).map((item, i) => {
                      const lines = variantLines(item);
                      return (
                        <li
                          key={`${order.id}-${item.productId}-${item.size}-${i}`}
                          className="flex gap-3 text-sm"
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt=""
                              className="h-14 w-11 rounded-md border border-gray-200 bg-white object-cover dark:border-gray-700"
                            />
                          ) : (
                            <div className="h-14 w-11 rounded-md border border-dashed border-gray-200 bg-white dark:border-gray-700" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-800 dark:text-white/90">
                              {item.name}
                            </div>
                            {lines.length > 0 && (
                              <div className="mt-0.5 text-xs text-gray-500">
                                {lines
                                  .map((l) => `${l.label}: ${l.value}`)
                                  .join(" · ")}
                              </div>
                            )}
                            <div className="mt-0.5 text-xs text-gray-400">
                              ×{item.quantity} ·{" "}
                              {formatAdminMoney(
                                (Number(item.priceNum) || 0) *
                                  (Number(item.quantity) || 1)
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {(order.city || order.address) && (
                    <p className="mt-3 text-xs text-gray-400">
                      Доставка:{" "}
                      {[order.city, order.address].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {order.comment && (
                    <p className="mt-1 text-xs text-gray-400">
                      Коментар: {order.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </ComponentCard>
        </div>
      )}
    </div>
  );
}
