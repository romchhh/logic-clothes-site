// /app/admin/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { siteFont } from "@/lib/fonts/manrope";
import { SidebarProvider } from "@/lib/SidebarContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import ClientLayoutShell from "@/components/admin/ClientLayoutShell";

export const metadata: Metadata = {
  title: "Logic Clothes — Admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={siteFont.variable}>
      <body className={`${siteFont.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <ClientLayoutShell>{children}</ClientLayoutShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
