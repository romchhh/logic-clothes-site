import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Нова чернетка — Logic Clothes Admin",
};

export default function AddProductPage() {
  return (
    <div>
      <AdminPageHeader
        title="Нова чернетка"
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Чернетка" },
        ]}
      />
      <ProductForm />
    </div>
  );
}
