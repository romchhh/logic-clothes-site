import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ProductForm from "@/components/admin/ProductForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Додати товар — Logic Clothes Admin",
};

export default function AddProductPage() {
  return (
    <div>
      <AdminPageHeader
        title="Додати товар"
        crumbs={[
          { label: "Товари", href: "/admin/products" },
          { label: "Додати" },
        ]}
      />
      <ProductForm />
    </div>
  );
}
