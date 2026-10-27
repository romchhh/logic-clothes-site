import Link from "next/link";
import React from "react";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: React.ReactNode;
};

export default function AdminPageHeader({
  title,
  description,
  crumbs,
  actions,
}: Props) {
  return (
    <header className="admin-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-2.5" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-gray-500 dark:text-gray-400">
              <li>
                <Link
                  href="/admin"
                  className="rounded-md px-1 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Огляд
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-1.5">
                  <span aria-hidden className="text-gray-300 dark:text-gray-600">
                    /
                  </span>
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="rounded-md px-1 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="px-1 font-medium text-gray-800 dark:text-gray-200">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[26px] font-semibold tracking-tight text-gray-900 dark:text-white sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {actions}
        </div>
      )}
    </header>
  );
}
