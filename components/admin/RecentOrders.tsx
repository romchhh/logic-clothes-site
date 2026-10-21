"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./ui/table";
import Badge from "@/components/admin/ui/badge/Badge";
import { useAdminStats } from "@/lib/useAdminStats";
import {
  formatAdminDate,
  formatAdminMoney,
  orderStatusBadgeColor,
  orderStatusLabel,
} from "@/lib/adminOrderStatus";

const thClass = "admin-th text-start";
const tdClass = "px-4 py-3 text-sm text-gray-600 dark:text-gray-400";

export default function RecentOrders() {
  const { stats, loading, error } = useAdminStats();
  const orders = stats?.recentOrders ?? [];

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3 className="admin-panel-title">Останні замовлення</h3>
          <p className="admin-panel-desc">Швидкий доступ до нових заявок</p>
        </div>
        <Link
          href="/admin/orders"
          className="admin-btn-secondary !h-9 !px-3.5 !text-[13px]"
        >
          Усі замовлення
        </Link>
      </div>

      <div className="overflow-x-auto px-2 pb-2 sm:px-3">
        {loading ? (
          <p className="px-3 py-6 text-sm text-gray-500">Завантаження…</p>
        ) : error ? (
          <p className="px-3 py-6 text-sm text-red-500">{error}</p>
        ) : orders.length === 0 ? (
          <p className="px-3 py-6 text-sm text-gray-500">Замовлень поки немає</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader className={thClass}>
                  ID
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Клієнт
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Сума
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Статус
                </TableCell>
                <TableCell isHeader className={thClass}>
                  Дата
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className={tdClass}>
                    <Link
                      href={`/admin/orders/${o.id}/edit`}
                      className="font-medium text-gray-900 hover:underline dark:text-white"
                    >
                      #{o.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className={tdClass}>{o.customerName}</TableCell>
                  <TableCell className={`${tdClass} tabular-nums`}>
                    {formatAdminMoney(o.total)}
                  </TableCell>
                  <TableCell className={tdClass}>
                    <Badge color={orderStatusBadgeColor(o.status)}>
                      {orderStatusLabel(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className={tdClass}>
                    {formatAdminDate(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
