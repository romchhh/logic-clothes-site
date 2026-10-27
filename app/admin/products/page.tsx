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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products/prices"
              className="admin-btn-secondary"
            >
              Редагувати всі ціни
            </Link>
            <Link href="/admin/products/add" className="admin-btn-primary">
              Додати товар
            </Link>
          </div>
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
