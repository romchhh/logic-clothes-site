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
          <>
            <Link href="/admin/products/add" className="admin-btn-primary">
              Додати товар
            </Link>
            <Link href="/admin/orders" className="admin-btn-secondary">
              Замовлення
            </Link>
          </>
        }
      />
      <EcommerceMetrics />
      <RecentOrders />
    </div>
  );
}
