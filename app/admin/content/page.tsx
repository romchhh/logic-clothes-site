import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ContentEditor from "@/components/admin/ContentEditor";
import FooterSloganForm from "@/components/admin/FooterSloganForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контент — Logic Clothes Admin",
};

export default function AdminContentPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Контент сторінок"
        description="Тексти (Markdown), фото сторінок, слоган у футері, магазин у Києві — усе в одному місці."
        crumbs={[{ label: "Контент" }]}
      />
      <FooterSloganForm />
      <ContentEditor />
    </div>
  );
}
