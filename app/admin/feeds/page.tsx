import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FeedsPanel from "@/components/admin/FeedsPanel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фіди — Logic Clothes Admin",
};

export default function FeedsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Фіди"
        description="Посилання на товарні фіди для Google Merchant і Meta — українською та англійською."
        crumbs={[{ label: "Фіди" }]}
      />
      <FeedsPanel />
    </div>
  );
}
