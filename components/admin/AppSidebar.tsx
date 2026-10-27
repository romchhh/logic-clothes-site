"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/lib/SidebarContext";
import {
  GridIcon,
  HorizontaLDots,
  TableIcon,
  ListIcon,
  BoxIconLine,
} from "@/public/admin-icons/index";

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M19.4 13.5a1.4 1.4 0 00.3 1.5l.1.1a1.7 1.7 0 11-2.4 2.4l-.1-.1a1.4 1.4 0 00-1.5-.3 1.4 1.4 0 00-.9 1.3V18.6a1.7 1.7 0 11-3.4 0v-.1a1.4 1.4 0 00-.9-1.3 1.4 1.4 0 00-1.5.3l-.1.1a1.7 1.7 0 11-2.4-2.4l.1-.1a1.4 1.4 0 00.3-1.5 1.4 1.4 0 00-1.3-.9H5.4a1.7 1.7 0 110-3.4h.1a1.4 1.4 0 001.3-.9 1.4 1.4 0 00-.3-1.5l-.1-.1a1.7 1.7 0 112.4-2.4l.1.1a1.4 1.4 0 001.5.3h.1a1.4 1.4 0 00.9-1.3V5.4a1.7 1.7 0 113.4 0v.1a1.4 1.4 0 00.9 1.3 1.4 1.4 0 001.5-.3l.1-.1a1.7 1.7 0 112.4 2.4l-.1.1a1.4 1.4 0 00-.3 1.5v.1a1.4 1.4 0 001.3.9h.1a1.7 1.7 0 110 3.4h-.1a1.4 1.4 0 00-1.3.9z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeedIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        fill="currentColor"
      />
      <path
        d="M5 5v2.5A11.5 11.5 0 0116.5 19H19A14 14 0 005 5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M5 11v2a6 6 0 016 6h2a8 8 0 00-8-8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeroIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 15l4.5-4.5a1.5 1.5 0 012.1 0L14 15l2.2-2.2a1.5 1.5 0 012.1 0L21 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="9" r="1.4" fill="currentColor" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M16 11a4 4 0 100-8 4 4 0 000 8zM8 13a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3.5 20.5c.6-3 2.9-5 5.5-5s4.9 2 5.5 5M13.5 15.5c2.4.3 4.5 2 5.2 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Огляд",
    items: [{ name: "Дашборд", icon: <GridIcon />, path: "/admin" }],
  },
  {
    label: "Каталог",
    items: [
      { name: "Товари", icon: <TableIcon />, path: "/admin/products" },
      { name: "Категорії", icon: <ListIcon />, path: "/admin/categories" },
    ],
  },
  {
    label: "Продажі",
    items: [
      { name: "Замовлення", icon: <BoxIconLine />, path: "/admin/orders" },
      { name: "Клієнти", icon: <UsersIcon />, path: "/admin/customers" },
    ],
  },
  {
    label: "Система",
    items: [
      { name: "Hero", icon: <HeroIcon />, path: "/admin/hero" },
      { name: "Фіди", icon: <FeedIcon />, path: "/admin/feeds" },
      {
        name: "Налаштування",
        icon: <SettingsIcon />,
        path: "/admin/settings",
      },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const showLabels = isExpanded || isHovered || isMobileOpen;

  const isSection = useCallback(
    (path: string) =>
      path === "/admin"
        ? pathname === "/admin"
        : pathname === path || pathname.startsWith(`${path}/`),
    [pathname]
  );

  return (
    <aside
      data-tour="tour-sidebar"
      data-scroll-lock-allow
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200/80 bg-white/95 px-3 text-gray-900 shadow-[4px_0_24px_-12px_rgba(16,24,40,0.08)] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-gray-800 dark:bg-[#141414]/95 dark:shadow-none lg:mt-0
        ${
          isExpanded || isMobileOpen
            ? "w-[248px]"
            : isHovered
              ? "w-[248px]"
              : "w-[72px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-6 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start px-2"
        }`}
      >
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#B7E1DF] text-[11px] font-bold tracking-[0.04em] text-[#111] shadow-[0_1px_2px_rgba(16,24,40,0.08)]">
            LC
          </span>
          {showLabels && (
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold tracking-tight text-gray-900 dark:text-white">
                Logic Clothes
              </span>
              <span className="block text-[11px] font-medium tracking-wide text-gray-400">
                Admin
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto pb-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <h2
              className={`mb-2 px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 ${
                !isExpanded && !isHovered
                  ? "lg:flex lg:justify-center"
                  : "justify-start"
              }`}
            >
              {showLabels ? group.label : <HorizontaLDots />}
            </h2>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((nav) => {
                const active = isSection(nav.path);
                return (
                  <li key={nav.path}>
                    <Link
                      href={nav.path}
                      className={`menu-item group ${
                        active ? "menu-item-active" : "menu-item-inactive"
                      } ${
                        !isExpanded && !isHovered
                          ? "lg:justify-center"
                          : "lg:justify-start"
                      }`}
                    >
                      <span
                        className={
                          active
                            ? "menu-item-icon-active"
                            : "menu-item-icon-inactive"
                        }
                      >
                        {nav.icon}
                      </span>
                      {showLabels && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {showLabels ? (
        <div className="mt-auto border-t border-gray-100 px-1 py-4 dark:border-white/[0.06]">
          <Link href="/admin/products/add" className="admin-sidebar-cta">
            <span aria-hidden>+</span>
            Новий товар
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex w-full items-center justify-center rounded-lg px-2 py-2 text-[12px] font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Відкрити магазин ↗
          </Link>
        </div>
      ) : (
        <div className="mt-auto border-t border-gray-100 py-3 dark:border-white/[0.06]">
          <Link
            href="/admin/products/add"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-lg font-semibold text-white dark:bg-[#B7E1DF] dark:text-gray-900"
            title="Новий товар"
            aria-label="Новий товар"
          >
            +
          </Link>
        </div>
      )}
    </aside>
  );
};

export default AppSidebar;
