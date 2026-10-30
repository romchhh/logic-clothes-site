import type { Metadata } from "next";
import Link from "next/link";
import React from "react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { EcommerceMetrics } from "@/components/admin/EcommerceMetrics";
import RecentOrders from "@/components/admin/RecentOrders";

export const metadata: Metadata = {
  title: "Огляд — Logic Clothes Admin",
  description: "Logic Clothes admin dashboard",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Огляд"
        description="Стан магазину за останніми замовленнями та каталогом."
        actions={
          <div
            data-tour="tour-dashboard-actions"
            className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
          >
            <Link
              href="/admin/products/add"
              className="admin-btn-primary w-full sm:w-auto"
            >
              Додати товар
            </Link>
            <Link
              href="/admin/hero"
              className="admin-btn-secondary flex-1 sm:flex-none"
            >
              Hero
            </Link>
            <Link
              href="/admin/orders"
              className="admin-btn-secondary flex-1 sm:flex-none"
            >
              Замовлення
            </Link>
          </div>
        }
      />
      <div data-tour="tour-dashboard-stats">
        <EcommerceMetrics />
      </div>
      <RecentOrders />
    </div>
  );
}
