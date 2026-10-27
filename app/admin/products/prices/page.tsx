import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BulkPricesEditor from "@/components/admin/BulkPricesEditor";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Ціни — Logic Clothes Admin",
};

export default function ProductPricesPage() {
  return (
    <div>
      <AdminPageHeader
        title="Редагування цін"
        description="Усі товари на одній сторінці — фото, ціна в ₴, EUR, USD і стара ціна для Sale."
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Ціни" },
        ]}
        actions={
          <Link href="/admin/products" className="admin-btn-secondary">
            До списку товарів
          </Link>
        }
      />
      <BulkPricesEditor />
    </div>
  );
}
