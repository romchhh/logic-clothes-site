import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BulkSeasonEditor from "@/components/admin/BulkSeasonEditor";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Сезонність — Logic Clothes Admin",
};

export default function ProductSeasonPage() {
  return (
    <div>
      <AdminPageHeader
        title="Редагування сезонності"
        description="Усі товари — літо / зима / без сезону. Потрібно для фільтра каталогу після переносу з нового сайту."
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Сезонність" },
        ]}
        actions={
          <Link href="/admin/products" className="admin-btn-secondary">
            До списку товарів
          </Link>
        }
      />
      <BulkSeasonEditor />
    </div>
  );
}
