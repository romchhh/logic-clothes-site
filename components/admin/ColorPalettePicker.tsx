"use client";

import React from "react";
import Label from "@/components/admin/form/Label";
import GroupedPaletteBoard from "@/components/palette/GroupedPaletteBoard";
import {
  COLOR_PALETTE,
  getPaletteColor,
  type PaletteColor,
} from "@/lib/colorPalette";

export type PaletteSelection = {
  /** Ordered palette ids on this SKU */
  ids: string[];
  /** Catalog / card primary color */
  primaryId: string | null;
  /** Storefront label per palette id (defaults to palette name). */
  labels: Record<string, string>;
};

type Props = {
  selection: PaletteSelection;
  onChange: (next: PaletteSelection) => void;
};

function defaultLabel(id: string): string {
  return getPaletteColor(id)?.label ?? id;
}

/** Keep user text while typing — defaults only for newly added ids. */
function pruneSelection(
  ids: string[],
  primaryId: string | null,
  labels: Record<string, string>
): PaletteSelection {
  const nextLabels = { ...labels };
  for (const key of Object.keys(nextLabels)) {
    if (!ids.includes(key)) delete nextLabels[key];
  }
  for (const id of ids) {
    if (!(id in nextLabels)) {
      nextLabels[id] = defaultLabel(id);
    }
  }
  return { ids, primaryId, labels: nextLabels };
}

export default function ColorPalettePicker({ selection, onChange }: Props) {
  const { ids, primaryId, labels } = selection;

  function emit(next: PaletteSelection) {
    onChange(pruneSelection(next.ids, next.primaryId, next.labels));
  }

  function togglePick(c: PaletteColor) {
    if (ids.includes(c.id)) {
      if (ids.length <= 1) return;
      const nextIds = ids.filter((id) => id !== c.id);
      const nextPrimary =
        primaryId === c.id ? nextIds[0] ?? null : primaryId;
      const nextLabels = { ...labels };
      delete nextLabels[c.id];
      emit({ ids: nextIds, primaryId: nextPrimary, labels: nextLabels });
      return;
    }
    emit({
      ids: [...ids, c.id],
      primaryId: primaryId ?? c.id,
      labels: { ...labels, [c.id]: labels[c.id]?.trim() || c.label },
    });
  }

  function setPrimary(id: string) {
    if (!ids.includes(id)) return;
    emit({ ids, primaryId: id, labels });
  }

  function setLabel(id: string, value: string) {
    if (!ids.includes(id)) return;
    onChange({
      ids,
      primaryId,
      labels: { ...labels, [id]: value },
    });
  }

  function finishLabel(id: string) {
    if (!ids.includes(id)) return;
    const trimmed = labels[id]?.trim() ?? "";
    if (trimmed) return;
    onChange({
      ids,
      primaryId,
      labels: { ...labels, [id]: defaultLabel(id) },
    });
  }

  const allIds = COLOR_PALETTE.map((c) => c.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => ids.includes(id));

  function selectAll() {
    const nextLabels = { ...labels };
    for (const id of allIds) {
      if (!nextLabels[id]?.trim()) nextLabels[id] = defaultLabel(id);
    }
    emit({
      ids: allIds,
      primaryId:
        primaryId && allIds.includes(primaryId) ? primaryId : allIds[0],
      labels: nextLabels,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] leading-snug text-gray-500 sm:text-[13px] dark:text-gray-400">
          На сторінці товару —{" "}
          <strong className="font-semibold text-gray-700 dark:text-gray-200">
            один квадратик і одна назва
          </strong>{" "}
          (блок нижче). Інші відтінки знизу лише для фільтрів — другої
          такої ж назви там немає.
        </p>
        <button
          type="button"
          className="admin-btn-secondary !h-8 !text-xs"
          disabled={allSelected}
          onClick={selectAll}
        >
          Обрати всі
        </button>
      </div>

      <GroupedPaletteBoard
        lang="uk"
        mode="pick"
        activeIds={ids}
        onPick={togglePick}
      />

      {primaryId && getPaletteColor(primaryId) ? (
        <div className="rounded-xl border border-[#B7E1DF]/70 bg-[#B7E1DF]/10 px-3 py-3 dark:border-[#B7E1DF]/25 dark:bg-[#B7E1DF]/5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            На сторінці товару (один квадратик)
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span
              className="h-14 w-14 shrink-0 border border-black/10 shadow-sm"
              style={{ backgroundColor: getPaletteColor(primaryId)!.hex }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor="palette-label-primary">Ваша назва кольору</Label>
              <input
                id="palette-label-primary"
                type="text"
                className="admin-input mt-1 !h-10 w-full text-[14px]"
                value={labels[primaryId] ?? ""}
                onChange={(e) => setLabel(primaryId, e.target.value)}
                onBlur={() => finishLabel(primaryId)}
                placeholder={defaultLabel(primaryId)}
                autoComplete="off"
                spellCheck
              />
            </div>
          </div>
        </div>
      ) : null}

      {ids.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">
            Усі обрані відтінки ({ids.length})
          </p>
          <ul className="space-y-2" aria-label="Кольори та назви">
            {ids
              .filter((id) => id !== primaryId)
              .map((id) => {
              const c = getPaletteColor(id);
              if (!c) return null;
              const isPrimary = false;
              const value = labels[id] ?? "";
              return (
                <li
                  key={id}
                  className={`rounded-xl border px-3 py-2.5 transition dark:border-white/10 ${
                    isPrimary
                      ? "border-[#B7E1DF]/80 bg-[#B7E1DF]/12"
                      : "border-gray-200 bg-white dark:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span
                        className="h-9 w-9 shrink-0 rounded-lg border border-black/10 shadow-sm"
                        style={{ backgroundColor: c.hex }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <label
                          htmlFor={`palette-label-${id}`}
                          className="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                        >
                          Палітра · {c.label}
                        </label>
                        <input
                          id={`palette-label-${id}`}
                          type="text"
                          className="admin-input !h-9 w-full !py-1.5 text-[13px]"
                          value={value}
                          onChange={(e) => setLabel(id, e.target.value)}
                          onBlur={() => finishLabel(id)}
                          placeholder={c.label}
                          autoCapitalize="sentences"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:pl-2">
                      {isPrimary ? (
                        <span className="inline-flex h-8 items-center rounded-lg bg-[#B7E1DF]/35 px-2.5 text-[11px] font-semibold text-gray-800 dark:text-gray-100">
                          основний у каталозі
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPrimary(id)}
                          className="admin-btn-ghost !h-8 whitespace-nowrap !px-2.5 !text-[11px]"
                        >
                          Зробити основним
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-[13px] text-amber-700 dark:text-amber-400">
          Оберіть хоча б один відтінок з палітри.
        </p>
      )}
    </div>
  );
}