import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CategoriesTable from "@/components/admin/tables/CategoriesTable";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Категорії — Logic Clothes Admin",
};

export default function CategoriesPage() {
  return (
    <div>
      <AdminPageHeader
        title="Категорії"
        description="Керуйте колекціями вітрини та категоріями товарів — назви, фото, порядок і видимість."
        crumbs={[{ label: "Категорії" }]}
      />
      <CategoriesTable />
    </div>
  );
}
