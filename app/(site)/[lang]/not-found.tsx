import type { Metadata } from "next";
import NotFoundPage from "@/components/shared/NotFoundPage";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundPage />;
}
