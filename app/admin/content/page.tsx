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
        description="Тексти (Markdown), фото сторінок, магазин у Києві та догляд — усе в одному місці."
        crumbs={[{ label: "Контент" }]}
      />
      <ContentEditor />
    </div>
  );
}
