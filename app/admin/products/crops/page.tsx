import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BulkCropEditor from "@/components/admin/BulkCropEditor";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Кадр фото — Logic Clothes Admin",
};

export default function ProductCropsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Кадрувати всі фото"
        description="Усі фото каталогу — кадр 3:5 як у картках. Можна пройти чергою або відкрити окреме фото."
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Кадр фото" },
        ]}
        actions={
          <Link href="/admin/products" className="admin-btn-secondary w-full sm:w-auto">
            До списку товарів
          </Link>
        }
      />
      <BulkCropEditor />
    </div>
  );
}
