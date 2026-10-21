import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CustomersTable from "@/components/admin/tables/CustomersTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Клієнти — Logic Clothes Admin",
};

export default function CustomersPage() {
  return (
    <div>
      <AdminPageHeader
        title="Клієнти"
        description="База клієнтів з контактами, історією замовлень і сумою покупок."
        crumbs={[{ label: "Клієнти" }]}
      />
      <CustomersTable />
    </div>
  );
}
