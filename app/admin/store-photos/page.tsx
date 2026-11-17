import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StorePhotosForm from "@/components/admin/StorePhotosForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Магазин у Києві — Logic Clothes Admin",
};

export default function AdminStorePhotosPage() {
  return (
    <div>
      <AdminPageHeader
        title="Магазин у Києві"
        description="Фото для блоку «наш магазин у Києві» на сторінці товару."
        crumbs={[{ label: "Магазин у Києві" }]}
      />
      <StorePhotosForm />
    </div>
  );
}
