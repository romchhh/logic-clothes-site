"use client";

import React, { useMemo, useState } from "react";
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
  /** Extra typeahead while typing in the custom field (e.g. brand sizes). */
  typeahead?: (query: string) => string[];
  normalizeValue?: (raw: string) => string;
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
  typeahead,
  normalizeValue,
}: Props) {
  const [custom, setCustom] = useState("");
  const [bulk, setBulk] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const pool = Array.from(new Set([...suggestions, ...selected]));
  const typeaheadHits = useMemo(() => {
    if (!typeahead || !custom.trim()) return [];
    return typeahead(custom).filter((v) => !selected.includes(v));
  }, [typeahead, custom, selected]);

  function addCustom() {
    const parts = custom
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (normalizeValue ? normalizeValue(s) : s));
    if (!parts.length) return;
    onBulkAdd(parts);
    setCustom("");
  }

  function applyBulk() {
    const parts = bulk
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (normalizeValue ? normalizeValue(s) : s));
    if (!parts.length) return;
    onBulkAdd(parts);
    setBulk("");
    setBulkOpen(false);
  }

  function pickTypeahead(value: string) {
    const next = normalizeValue ? normalizeValue(value) : value;
    if (singleSelect && onSingleSelect) {
      onSingleSelect(next);
    } else if (!selected.includes(next)) {
      onToggle(next);
    }
    setCustom("");
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>{label}</Label>
        {hint ? (
          <p className="mt-1 hidden text-[12px] leading-snug text-gray-500 sm:block dark:text-gray-400">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="admin-suggest-rail" role="listbox">
        {pool.map((value) => {
          const active = singleSelect
            ? activeValue === value
            : selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              role="option"
              aria-selected={active}
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
              className={`admin-chip admin-suggest-chip ${
                active ? "admin-chip-active" : ""
              }`}
              title={value}
            >
              {value.length > 36 ? `${value.slice(0, 36)}…` : value}
            </button>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 sm:max-w-md sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <input
            className="admin-input w-full"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={placeholderChip}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (typeaheadHits[0]) {
                  pickTypeahead(typeaheadHits[0]);
                  return;
                }
                addCustom();
              }
            }}
          />
          {typeaheadHits.length > 0 ? (
            <ul className="admin-chip-typeahead" role="listbox">
              {typeaheadHits.map((value) => (
                <li key={value}>
                  <button
                    type="button"
                    role="option"
                    className="admin-chip-typeahead-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickTypeahead(value)}
                  >
                    {value}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          onClick={addCustom}
          className="admin-btn-secondary shrink-0 sm:!h-10"
        >
          Додати
        </button>
      </div>
      <div>
        <button
          type="button"
          className="admin-btn-ghost !h-8 !px-0 !text-[12px] text-gray-500"
          onClick={() => setBulkOpen((v) => !v)}
          aria-expanded={bulkOpen}
        >
          {bulkOpen ? "▴ Сховати список" : "▾ Вставити список"}
        </button>
        {bulkOpen ? (
          <div className="mt-2 space-y-2">
            <TextArea
              rows={2}
              value={bulk}
              onChange={setBulk}
              placeholder={bulkPlaceholder}
            />
            <button
              type="button"
              onClick={applyBulk}
              className="admin-btn-secondary"
            >
              Додати всі
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
