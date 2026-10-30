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
    <div className="admin-panel" data-tour="tour-customers-page">
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
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук: імʼя, телефон, email…"
            className="admin-input w-full sm:w-72"
          />
          <button
            type="button"
            onClick={load}
            className="admin-btn-secondary !h-10 shrink-0 !text-[13px]"
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
      <div className="divide-y divide-gray-100 dark:divide-white/[0.05] md:hidden">
        {loading ? (
          <p className="p-4 text-sm text-gray-500">Завантаження...</p>
        ) : paginated.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Клієнтів поки немає</p>
        ) : (
          paginated.map((c) => (
            <div key={c.id} className="space-y-3 px-3 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-gray-900 dark:text-white">
                  {c.name}
                </p>
                <a
                  href={`tel:${c.phone}`}
                  className="mt-0.5 block text-sm text-gray-500 hover:underline"
                >
                  {c.phoneDisplay}
                </a>
                {c.email && (
                  <p className="mt-0.5 truncate text-[12px] text-gray-400">
                    {c.email}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[12px] text-gray-500">
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400">
                    Замовлень
                  </div>
                  <div className="mt-0.5 font-medium tabular-nums text-gray-800 dark:text-white/90">
                    {c.orderCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400">
                    Сума
                  </div>
                  <div className="mt-0.5 font-medium tabular-nums text-gray-800 dark:text-white/90">
                    {formatAdminMoney(c.totalSpent)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wide text-gray-400">
                    Останнє
                  </div>
                  <div className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                    {formatAdminDate(c.lastOrderAt)}
                  </div>
                </div>
              </div>
              <Link
                href={`/admin/customers/${encodeURIComponent(c.id)}`}
                className="admin-btn-secondary !h-9 w-full !text-xs"
              >
                Відкрити
              </Link>
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
