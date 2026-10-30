import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BulkCategoryEditor from "@/components/admin/BulkCategoryEditor";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Категорії товарів — Logic Clothes Admin",
};

export default function ProductCategoriesBulkPage() {
  return (
    <div>
      <AdminPageHeader
        title="Редагування категорій"
        description="Усі товари — оберіть категорію для кожного. Пошук і фільтр за категорією."
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Категорії" },
        ]}
        actions={
          <Link href="/admin/products" className="admin-btn-secondary">
            До списку товарів
          </Link>
        }
      />
      <BulkCategoryEditor />
    </div>
  );
}
