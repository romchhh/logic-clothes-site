import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductsTable from "@/components/admin/tables/ProductsTable";
import { Metadata } from "next";
import Link from "next/link";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Товари — Logic Clothes Admin",
};

export default function ProductsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Товари"
        description="Каталог магазину — пошук, наявність і швидке редагування."
        crumbs={[{ label: "Товари" }]}
        actions={
          <Link href="/admin/products/add" className="admin-btn-primary">
            Додати товар
          </Link>
        }
      />
      <Suspense
        fallback={
          <div className="admin-panel px-5 py-8 text-sm text-gray-500">
            Завантаження…
          </div>
        }
      >
        <ProductsTable />
      </Suspense>
    </div>
  );
}
