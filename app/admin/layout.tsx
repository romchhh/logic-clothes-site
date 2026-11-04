// /app/admin/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { jost } from "@/lib/fonts/jost";
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
    <html lang="uk" className={jost.variable}>
      <body className={`${jost.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <ClientLayoutShell>{children}</ClientLayoutShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
