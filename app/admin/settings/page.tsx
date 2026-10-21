import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SettingsForm from "@/components/admin/SettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Налаштування — Logic Clothes Admin",
};

export default function SettingsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Налаштування"
        description="API-ключі та інтеграції: Telegram, Нова Пошта, публічний URL сайту."
        crumbs={[{ label: "Налаштування" }]}
      />
      <SettingsForm />
    </div>
  );
}
