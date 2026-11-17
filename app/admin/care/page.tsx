import AdminPageHeader from "@/components/admin/AdminPageHeader";
import CareInstructionsForm from "@/components/admin/CareInstructionsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Догляд — Logic Clothes Admin",
};

export default function AdminCarePage() {
  return (
    <div>
      <AdminPageHeader
        title="Догляд"
        description="Фото, назви та тексти чотирьох варіантів догляду. На картці товару обирається один з них."
        crumbs={[{ label: "Догляд" }]}
      />
      <CareInstructionsForm />
    </div>
  );
}
