"use client";

import { useState } from "react";

type Props = {
  suggestions: string[];
  value?: string;
  onSelect: (value: string) => void;
  emptyHint?: string;
  /** Optional: add a new value into the shared list */
  onRemember?: (value: string) => void;
  addPlaceholder?: string;
};

/** Max 3 rows, horizontal scroll — compact chip rail. */
export default function AdminSuggestRail({
  suggestions,
  value = "",
  onSelect,
  emptyHint,
  onRemember,
  addPlaceholder = "Додати в список",
}: Props) {
  const [draft, setDraft] = useState("");
  const active = value.trim();
  const pool = Array.from(
    new Set(suggestions.map((s) => s.trim()).filter(Boolean))
  );

  function commitDraft() {
    const next = draft.trim();
    if (!next) return;
    onRemember?.(next);
    onSelect(next);
    setDraft("");
  }

  if (!pool.length && !onRemember) {
    return emptyHint ? (
      <p className="mt-1.5 text-[11px] text-gray-400">{emptyHint}</p>
    ) : null;
  }

  return (
    <div className="admin-suggest">
      {pool.length ? (
        <div className="admin-suggest-rail" role="listbox" aria-label="Підказки">
          {pool.map((item) => {
            const isOn = active === item;
            return (
              <button
                key={item}
                type="button"
                role="option"
                aria-selected={isOn}
                title={item}
                className={`admin-chip admin-suggest-chip${
                  isOn ? " admin-chip-active" : ""
                }`}
                onClick={() => onSelect(item)}
              >
                {item.length > 42 ? `${item.slice(0, 42)}…` : item}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-1.5 text-[11px] text-gray-400">
          {emptyHint || "Список порожній — додайте варіант нижче"}
        </p>
      )}
      {onRemember ? (
        <div className="admin-suggest-add">
          <input
            className="admin-input flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={addPlaceholder}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitDraft();
              }
            }}
          />
          <button
            type="button"
            className="admin-btn-secondary shrink-0"
            onClick={commitDraft}
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  );
}
