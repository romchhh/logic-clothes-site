import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ContentEditor from "@/components/admin/ContentEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контент — Logic Clothes Admin",
};

export default function AdminContentPage() {
  return (
    <div>
      <AdminPageHeader
        title="Контент сторінок"
        description="Тексти (Markdown) і фото для «Про нас», оплати/доставки та інших сторінок — UA і EN."
        crumbs={[{ label: "Контент" }]}
      />
      <ContentEditor />
    </div>
  );
}
