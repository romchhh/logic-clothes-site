"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Pagination from "./Pagination";
import type { StoredOrder } from "@/lib/adminStore";
import {
  ORDER_STATUS_OPTIONS,
  formatAdminDate,
  formatAdminMoney,
} from "@/lib/adminOrderStatus";

const PER_PAGE = 10;

const thClass =
  "px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300";
const tdClass = "px-5 py-4 text-sm text-gray-600 dark:text-gray-400";

export default function OrdersTable() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as StoredOrder[];
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching orders:", e);
      setError("Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalSum = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0),
    [orders]
  );

  const totalPages = Math.max(1, Math.ceil(orders.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => orders.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [orders, currentPage]
  );

  async function handleStatusChange(id: string, status: string) {
    const prev = orders;
    setOrders((list) =>
      list.map((o) =>
        o.id === id ? { ...o, status: status as StoredOrder["status"] } : o
      )
    );
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error("Error updating status:", e);
      setOrders(prev);
      alert("Не вдалося оновити статус");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Видалити замовлення ${id}?`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOrders((list) => list.filter((o) => o.id !== id));
    } catch (e) {
      console.error("Error deleting order:", e);
      alert("Не вдалося видалити замовлення");
    }
  }

  const statusSelect = (o: StoredOrder) => (
    <select
      value={o.status}
      onChange={(e) => handleStatusChange(o.id, e.target.value)}
      className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
    >
      {ORDER_STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );

  const actions = (o: StoredOrder) => (
    <div className="flex flex-wrap items-center gap-1.5">
      <Link
        href={`/admin/orders/${encodeURIComponent(o.id)}/edit`}
        className="admin-btn-secondary !h-8 !px-3 !text-xs"
      >
        Відкрити
      </Link>
      <button
        type="button"
        onClick={() => handleDelete(o.id)}
        className="admin-btn-danger"
      >
        Видалити
      </button>
    </div>
  );

  return (
    <div className="admin-panel" data-tour="tour-orders-page">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-panel-title">
            Замовлення{" "}
            <span className="font-normal text-gray-400">({orders.length})</span>
          </h2>
          <p className="admin-panel-desc">
            Сума без скасованих: {formatAdminMoney(totalSum)}
          </p>
        </div>
        <button onClick={load} className="admin-btn-secondary !py-2 text-[13px]">
          Оновити
        </button>
      </div>

      {error && <div className="px-5 py-4 text-sm text-red-500">{error}</div>}

      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[960px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className={thClass}>
                  ID
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Дата
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Клієнт
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Телефон
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Сума
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Статус
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Дії
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Завантаження...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-6 text-center text-gray-500 dark:text-gray-400"
                  >
                    Замовлень поки немає
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {o.id}
                    </TableCell>
                    <TableCell className={tdClass}>
                      {formatAdminDate(o.createdAt)}
                    </TableCell>
                    <TableCell className={tdClass}>{o.customerName}</TableCell>
                    <TableCell className={tdClass}>{o.phone}</TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatAdminMoney(o.total)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {statusSelect(o)}
                    </TableCell>
                    <TableCell className="px-5 py-4">{actions(o)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05] md:hidden">
        {loading ? (
          <div className="p-5 text-center text-sm text-gray-500">
            Завантаження...
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-5 text-center text-sm text-gray-500">
            Замовлень поки немає
          </div>
        ) : (
          paginated.map((o) => (
            <div key={o.id} className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {o.id}
                </span>
                <span className="text-xs text-gray-500">
                  {formatAdminDate(o.createdAt)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {o.customerName} · {o.phone}
              </div>
              <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                {formatAdminMoney(o.total)}
              </div>
              {statusSelect(o)}
              {actions(o)}
            </div>
          ))
        )}
      </div>

      {!loading && orders.length > PER_PAGE && (
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setPage(Math.min(Math.max(1, p), totalPages))}
          />
        </div>
      )}
    </div>
  );
}
