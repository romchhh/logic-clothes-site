"use client";

import { useParams } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(String(params.id)) : "";

  return (
    <div>
      <AdminPageHeader
        title="Редагувати товар"
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: id || "…" },
        ]}
      />
      {id ? <ProductForm key={id} productId={id} /> : null}
    </div>
  );
}
