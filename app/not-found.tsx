import type { Metadata } from "next";
import NotFoundPage from "@/components/shared/NotFoundPage";
import SiteHtmlShell from "@/components/SiteHtmlShell";
import "./(site)/globals.css";

export const metadata: Metadata = {
  title: "404 — сторінку не знайдено",
  description: "Цю сторінку Logic Clothes не знайдено.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <SiteHtmlShell lang="uk">
      <NotFoundPage lang="uk" />
    </SiteHtmlShell>
  );
}
