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
        description="Завжди всі товари. Пошук, сортування й категорія — лише на цю сесію."
        crumbs={[{ label: "Товари" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products/stock"
              className="admin-btn-secondary"
            >
              Редагувати наявність
            </Link>
            <Link
              href="/admin/products/categories"
              className="admin-btn-secondary"
            >
              Редагувати категорії
            </Link>
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
