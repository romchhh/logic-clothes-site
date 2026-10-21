"use client";

import React, { useMemo, useState } from "react";

type FeedRow = {
  platform: string;
  lang: string;
  langLabel: string;
  path: string;
  hint: string;
};

const FEEDS: FeedRow[] = [
  {
    platform: "Google Merchant",
    lang: "uk",
    langLabel: "Українська",
    path: "/feeds/google/uk.xml",
    hint: "Google Merchant Center → Products → Feeds",
  },
  {
    platform: "Google Merchant",
    lang: "en",
    langLabel: "English",
    path: "/feeds/google/en.xml",
    hint: "Google Merchant Center → Products → Feeds",
  },
  {
    platform: "Meta (Facebook / Instagram)",
    lang: "uk",
    langLabel: "Українська",
    path: "/feeds/meta/uk.xml",
    hint: "Meta Commerce Manager → Catalog → Data sources (Google format)",
  },
  {
    platform: "Meta (Facebook / Instagram)",
    lang: "en",
    langLabel: "English",
    path: "/feeds/meta/en.xml",
    hint: "Meta Commerce Manager → Catalog → Data sources (Google format)",
  },
];

export default function FeedsPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  const origin = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const byPlatform = useMemo(() => {
    const map = new Map<string, FeedRow[]>();
    for (const f of FEEDS) {
      const list = map.get(f.platform) ?? [];
      list.push(f);
      map.set(f.platform, list);
    }
    return [...map.entries()];
  }, []);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        XML-фіди оновлюються автоматично з каталогу (кеш ~5 хв). Додайте URL у
        кабінеті Google або Meta як scheduled fetch.
      </p>

      {byPlatform.map(([platform, rows]) => (
        <section key={platform} className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2 className="admin-panel-title">{platform}</h2>
              <p className="admin-panel-desc">{rows[0]?.hint}</p>
            </div>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {rows.map((row) => {
              const url = `${origin}${row.path}`;
              return (
                <li
                  key={row.path}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {row.langLabel}
                      </span>
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-gray-500 dark:bg-white/10 dark:text-gray-400">
                        {row.lang}
                      </span>
                    </div>
                    <a
                      href={row.path}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block truncate font-mono text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                      {url || row.path}
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={row.path}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-btn-secondary !py-2 text-[13px]"
                    >
                      Відкрити
                    </a>
                    <button
                      type="button"
                      className="admin-btn-primary !py-2 text-[13px]"
                      onClick={() => void copy(url || row.path)}
                    >
                      {copied === url ? "Скопійовано" : "Копіювати"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
