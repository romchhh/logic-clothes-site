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
import type { CustomerSummary } from "@/lib/adminCustomers";
import {
  formatAdminDate,
  formatAdminMoney,
} from "@/lib/adminOrderStatus";

const PER_PAGE = 12;

const thClass =
  "px-5 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300";
const tdClass = "px-5 py-4 text-sm text-gray-600 dark:text-gray-400";

export default function CustomersTable() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/customers", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CustomerSummary[];
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching customers:", e);
      setError("Не вдалося завантажити клієнтів");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const hay = [
        c.name,
        c.phone,
        c.phoneDisplay,
        c.email,
        c.city,
        c.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [customers, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalSpent = useMemo(
    () => filtered.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    [filtered]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () =>
      filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filtered, currentPage]
  );

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h2 className="admin-panel-title">
            Клієнти{" "}
            <span className="font-normal text-gray-400">
              ({filtered.length})
            </span>
          </h2>
          <p className="admin-panel-desc">
            Сума покупок (без скасованих): {formatAdminMoney(totalSpent)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук: імʼя, телефон, email…"
            className="h-10 w-full min-w-[220px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none focus:border-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 sm:w-72"
          />
          <button
            type="button"
            onClick={load}
            className="admin-btn-secondary !py-2 text-[13px]"
          >
            Оновити
          </button>
        </div>
      </div>

      {error && <div className="px-5 py-4 text-sm text-red-500">{error}</div>}

      <div className="hidden overflow-x-auto md:block">
        <div className="min-w-[960px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className={thClass}>
                  Клієнт
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Телефон
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Email
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Місто
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Замовлень
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Сума
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Останнє
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
                    colSpan={8}
                    className="py-6 text-center text-gray-500"
                  >
                    Завантаження...
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-6 text-center text-gray-500"
                  >
                    Клієнтів поки немає
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className={tdClass}>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {c.name}
                      </div>
                    </TableCell>
                    <TableCell className={tdClass}>
                      <a
                        href={`tel:${c.phone}`}
                        className="hover:underline"
                      >
                        {c.phoneDisplay}
                      </a>
                    </TableCell>
                    <TableCell className={tdClass}>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="hover:underline"
                        >
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className={tdClass}>{c.city || "—"}</TableCell>
                    <TableCell className={`${tdClass} tabular-nums`}>
                      {c.orderCount}
                    </TableCell>
                    <TableCell className={`${tdClass} tabular-nums`}>
                      {formatAdminMoney(c.totalSpent)}
                    </TableCell>
                    <TableCell className={tdClass}>
                      {formatAdminDate(c.lastOrderAt)}
                    </TableCell>
                    <TableCell className={tdClass}>
                      <Link
                        href={`/admin/customers/${encodeURIComponent(c.id)}`}
                        className="admin-btn-secondary !h-8 !px-3 !text-xs"
                      >
                        Відкрити
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 p-4 md:hidden">
        {loading ? (
          <p className="text-sm text-gray-500">Завантаження...</p>
        ) : paginated.length === 0 ? (
          <p className="text-sm text-gray-500">Клієнтів поки немає</p>
        ) : (
          paginated.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {c.name}
                  </p>
                  <a
                    href={`tel:${c.phone}`}
                    className="mt-1 block text-sm text-gray-500 hover:underline"
                  >
                    {c.phoneDisplay}
                  </a>
                  {c.email && (
                    <p className="mt-0.5 text-sm text-gray-400">{c.email}</p>
                  )}
                </div>
                <Link
                  href={`/admin/customers/${encodeURIComponent(c.id)}`}
                  className="admin-btn-secondary !h-8 !px-3 !text-xs"
                >
                  Відкрити
                </Link>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div>
                  <div className="uppercase tracking-wide text-gray-400">
                    Замовлень
                  </div>
                  <div className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                    {c.orderCount}
                  </div>
                </div>
                <div>
                  <div className="uppercase tracking-wide text-gray-400">
                    Сума
                  </div>
                  <div className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                    {formatAdminMoney(c.totalSpent)}
                  </div>
                </div>
                <div>
                  <div className="uppercase tracking-wide text-gray-400">
                    Останнє
                  </div>
                  <div className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                    {formatAdminDate(c.lastOrderAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && filtered.length > PER_PAGE && (
        <div className="flex justify-end border-t border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
