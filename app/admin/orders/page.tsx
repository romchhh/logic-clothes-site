import AdminPageHeader from "@/components/admin/AdminPageHeader";
import OrdersTable from "@/components/admin/tables/OrderTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Замовлення — Logic Clothes Admin",
};

export default function OrdersPage() {
  return (
    <div>
      <AdminPageHeader
        title="Замовлення"
        description="Обробка замовлень, статуси та контакти клієнтів."
        crumbs={[{ label: "Замовлення" }]}
      />
      <OrdersTable />
    </div>
  );
}
