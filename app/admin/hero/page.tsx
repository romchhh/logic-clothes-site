import AdminPageHeader from "@/components/admin/AdminPageHeader";
import HeroSettingsForm from "@/components/admin/HeroSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hero — Logic Clothes Admin",
};

export default function AdminHeroPage() {
  return (
    <div>
      <AdminPageHeader
        title="Hero головної"
        description="Фото, мітка «З …» та опційні заголовок / підзаголовок на першому екрані сайту."
        crumbs={[{ label: "Hero" }]}
      />
      <HeroSettingsForm />
    </div>
  );
}
