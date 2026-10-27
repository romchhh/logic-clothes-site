"use client";

import React, { useState } from "react";
import Label from "@/components/admin/form/Label";
import TextArea from "@/components/admin/form/input/TextArea";

type Props = {
  label: string;
  hint?: string;
  placeholderChip?: string;
  bulkPlaceholder?: string;
  suggestions: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onBulkAdd: (values: string[]) => void;
  singleSelect?: boolean;
  activeValue?: string;
  onSingleSelect?: (value: string) => void;
  /** add: chip click only adds to selection, never removes */
  chipMode?: "toggle" | "add";
};

export default function AdminChipField({
  label,
  hint,
  placeholderChip = "Свій варіант",
  bulkPlaceholder = "Кілька значень — через кому або з нового рядка",
  suggestions,
  selected,
  onToggle,
  onBulkAdd,
  singleSelect = false,
  activeValue = "",
  onSingleSelect,
  chipMode = "toggle",
}: Props) {
  const [custom, setCustom] = useState("");
  const [bulk, setBulk] = useState("");

  const pool = Array.from(new Set([...suggestions, ...selected]));

  function addCustom() {
    const parts = custom
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onBulkAdd(parts);
    setCustom("");
  }

  function applyBulk() {
    const parts = bulk
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onBulkAdd(parts);
    setBulk("");
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint && (
          <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {pool.map((value) => {
          const active = singleSelect
            ? activeValue === value
            : selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => {
                if (singleSelect && onSingleSelect) {
                  onSingleSelect(value);
                  return;
                }
                if (chipMode === "add") {
                  if (!selected.includes(value)) onToggle(value);
                  return;
                }
                onToggle(value);
              }}
              className={`admin-chip ${active ? "admin-chip-active" : ""}`}
              title={value}
            >
              {value.length > 48 ? `${value.slice(0, 48)}…` : value}
            </button>
          );
        })}
      </div>
      <div className="flex max-w-md items-center gap-2">
        <input
          className="admin-input flex-1"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={placeholderChip}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          className="admin-btn-secondary shrink-0"
        >
          Додати
        </button>
      </div>
      <div className="space-y-2">
        <Label>Вставити багато одразу</Label>
        <TextArea
          rows={3}
          value={bulk}
          onChange={setBulk}
          placeholder={bulkPlaceholder}
        />
        <button
          type="button"
          onClick={applyBulk}
          className="admin-btn-secondary"
        >
          Додати всі до списку
        </button>
      </div>
    </div>
  );
}
