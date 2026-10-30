import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BulkStockEditor from "@/components/admin/BulkStockEditor";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Наявність — Logic Clothes Admin",
};

export default function ProductStockPage() {
  return (
    <div>
      <AdminPageHeader
        title="Редагування наявності"
        description="Усі товари — галочки «В наявності» та «Зшиємо за 14 днів». Пошук за назвою."
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Наявність" },
        ]}
        actions={
          <Link href="/admin/products" className="admin-btn-secondary">
            До списку товарів
          </Link>
        }
      />
      <BulkStockEditor />
    </div>
  );
}
