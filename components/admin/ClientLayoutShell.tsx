"use client";

import { useSidebar } from "@/lib/SidebarContext";
import AppSidebar from "@/components/admin/AppSidebar";
import AppHeader from "@/components/admin/AppHeader";
import Backdrop from "@/components/admin/Backdrop";
import { usePathname } from "next/navigation";
import React from "react";

export default function ClientLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[248px]"
      : "lg:ml-[72px]";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="mx-auto max-w-[1400px] p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
