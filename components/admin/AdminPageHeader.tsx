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
    <header className="admin-page-header flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {crumbs && crumbs.length > 0 && (
          <nav className="mb-1.5 sm:mb-2.5" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400 sm:gap-1.5 sm:text-[12.5px]">
              <li>
                <Link
                  href="/admin"
                  className="rounded-md px-1 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Огляд
                </Link>
              </li>
              {crumbs.map((c) => (
                <li key={c.label} className="flex max-w-[50vw] items-center gap-1 sm:gap-1.5">
                  <span aria-hidden className="text-gray-300 dark:text-gray-600">
                    /
                  </span>
                  {c.href ? (
                    <Link
                      href={c.href}
                      className="truncate rounded-md px-1 py-0.5 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="truncate px-1 font-medium text-gray-800 dark:text-gray-200">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-[28px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 hidden max-w-2xl text-[14px] leading-relaxed text-gray-500 sm:mt-1.5 sm:block dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="admin-page-actions flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
