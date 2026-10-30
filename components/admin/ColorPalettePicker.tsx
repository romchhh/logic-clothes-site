"use client";

import React from "react";
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
};

type Props = {
  selection: PaletteSelection;
  onChange: (next: PaletteSelection) => void;
};

export default function ColorPalettePicker({ selection, onChange }: Props) {
  const { ids, primaryId } = selection;

  function togglePick(c: PaletteColor) {
    if (ids.includes(c.id)) {
      if (ids.length <= 1) return;
      const nextIds = ids.filter((id) => id !== c.id);
      const nextPrimary =
        primaryId === c.id ? nextIds[0] ?? null : primaryId;
      onChange({ ids: nextIds, primaryId: nextPrimary });
      return;
    }
    onChange({
      ids: [...ids, c.id],
      primaryId: primaryId ?? c.id,
    });
  }

  function setPrimary(id: string) {
    if (!ids.includes(id)) return;
    onChange({ ids, primaryId: id });
  }

  return (
    <div className="space-y-4">
      <p className="hidden text-[13px] leading-snug text-gray-500 sm:block dark:text-gray-400">
        Відтінки на цій сторінці. Інший колір моделі — окремий товар у блоці
        «Звʼязки».
      </p>

      <GroupedPaletteBoard
        lang="uk"
        mode="pick"
        activeIds={ids}
        onPick={togglePick}
      />

      {ids.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-gray-400">
            Кольори цього товару ({ids.length})
          </p>
          <ul className="flex flex-wrap gap-2">
            {ids.map((id) => {
              const c = getPaletteColor(id);
              if (!c) return null;
              const isPrimary = primaryId === id;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setPrimary(id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[12px] transition ${
                      isPrimary
                        ? "border-[#B7E1DF] bg-[#B7E1DF]/20 font-semibold text-gray-900 dark:text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                    }`}
                    title={
                      isPrimary
                        ? "Основний колір у каталозі"
                        : "Зробити основним у каталозі"
                    }
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden
                    />
                    <span>{c.label}</span>
                    {isPrimary ? (
                      <span className="text-[10px] font-medium text-gray-500">
                        основний
                      </span>
                    ) : null}
                  </button>
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

      {primaryId ? (
        <p className="text-[13px] text-gray-700 dark:text-gray-300">
          Основний для каталогу:{" "}
          <span className="font-medium">
            {COLOR_PALETTE.find((c) => c.id === primaryId)?.label}
          </span>
          <span className="ml-2 font-mono text-[12px] text-gray-400">
            {getPaletteColor(primaryId)?.hex}
          </span>
        </p>
      ) : null}
    </div>
  );
}
