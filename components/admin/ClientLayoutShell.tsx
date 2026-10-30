"use client";

import { useSidebar } from "@/lib/SidebarContext";
import AppSidebar from "@/components/admin/AppSidebar";
import AppHeader from "@/components/admin/AppHeader";
import Backdrop from "@/components/admin/Backdrop";
import { AdminTour } from "@/components/admin/AdminTour";
import {
  ADMIN_TOUR_EVENT,
  completeAdminTour,
  isAdminTourForced,
  shouldShowAdminTour,
} from "@/lib/admin/tour";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function ClientLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [tourActive, setTourActive] = useState(false);

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[248px]"
      : "lg:ml-[72px]";

  useEffect(() => {
    if (isLoginPage || tourActive) return;
    if (!shouldShowAdminTour()) return;
    const force = isAdminTourForced();
    if (!force && pathname !== "/admin") return;
    const timer = window.setTimeout(
      () => setTourActive(true),
      force ? 120 : 600
    );
    return () => window.clearTimeout(timer);
  }, [pathname, tourActive, isLoginPage]);

  useEffect(() => {
    const onStartTour = () => setTourActive(true);
    window.addEventListener(ADMIN_TOUR_EVENT, onStartTour);
    return () => window.removeEventListener(ADMIN_TOUR_EVENT, onStartTour);
  }, []);

  const finishTour = () => {
    completeAdminTour();
    setTourActive(false);
  };

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
        <main className="admin-main mx-auto max-w-[1400px] px-3 pb-6 pt-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {tourActive ? (
        <AdminTour onComplete={finishTour} onSkip={finishTour} />
      ) : null}
    </div>
  );
}
