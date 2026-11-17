"use client";

import React, { useRef, useState } from "react";
import MarkdownBody from "@/components/shared/MarkdownBody";

type Props = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  label?: string;
  hint?: string;
};

function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder = "текст"
): { next: string; selStart: number; selEnd: number } {
  const selected = value.slice(start, end) || placeholder;
  const next =
    value.slice(0, start) + before + selected + after + value.slice(end);
  const selStart = start + before.length;
  const selEnd = selStart + selected.length;
  return { next, selStart, selEnd };
}

export default function MarkdownEditor({
  value,
  onChange,
  rows = 16,
  hint,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const apply = (before: string, after: string, placeholder?: string) => {
    const el = ref.current;
    if (!el) {
      onChange(`${before}${placeholder || "текст"}${after}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const { next, selStart, selEnd } = wrapSelection(
      value,
      start,
      end,
      before,
      after,
      placeholder
    );
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selStart, selEnd);
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const el = ref.current;
    if (!el) {
      onChange(`${prefix}${value}`);
      return;
    }
    const start = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next =
      value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length
      );
    });
  };

  return (
    <div className="space-y-2">
      {hint ? (
        <p className="text-[12px] leading-snug text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-white/[0.03]">
        {(
          [
            ["edit", "Редактор"],
            ["preview", "Перегляд"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${
              tab === id
                ? "bg-white text-gray-900 shadow-sm dark:bg-[#1a1a1a] dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
        <button
          type="button"
          className="rounded px-2 py-1 text-[12px] font-semibold text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10"
          onClick={() => apply("**", "**", "жирний")}
          title="Жирний"
        >
          B
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[12px] italic text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10"
          onClick={() => apply("_", "_", "курсив")}
          title="Курсив"
        >
          I
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[12px] text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10"
          onClick={() => insertLinePrefix("## ")}
          title="Заголовок"
        >
          H2
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[12px] text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10"
          onClick={() => insertLinePrefix("- ")}
          title="Список"
        >
          • Список
        </button>
        <button
          type="button"
          className="rounded px-2 py-1 text-[12px] text-gray-700 hover:bg-white dark:text-gray-300 dark:hover:bg-white/10"
          onClick={() => apply("[", "](https://)", "посилання")}
          title="Посилання"
        >
          Link
        </button>
      </div>

      {tab === "edit" ? (
        <textarea
          ref={ref}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-[#0f0f0f] dark:text-gray-100"
          spellCheck
        />
      ) : (
        <div className="min-h-[200px] rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#0f0f0f]">
          {value.trim() ? (
            <MarkdownBody markdown={value} className="content-md content-md--admin" />
          ) : (
            <p className="text-sm text-gray-400">Порожньо</p>
          )}
        </div>
      )}
    </div>
  );
}
