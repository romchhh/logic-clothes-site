import NotFoundPage from "@/components/shared/NotFoundPage";
import SiteHtmlShell from "@/components/SiteHtmlShell";
import "./(site)/globals.css";

export default function NotFound() {
  return (
    <SiteHtmlShell lang="uk">
      <NotFoundPage lang="uk" />
    </SiteHtmlShell>
  );
}
