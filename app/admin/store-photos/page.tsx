import { redirect } from "next/navigation";

/** Merged into Сайт → Контент (вкладка «Магазин у Києві»). */
export default function AdminStorePhotosRedirect() {
  redirect("/admin/content");
}
