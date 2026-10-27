"use client";

import React from "react";
import GroupedPaletteBoard from "@/components/palette/GroupedPaletteBoard";
import { COLOR_PALETTE, resolvePaletteId } from "@/lib/colorPalette";

type Props = {
  color: string;
  colorHex: string;
  onChange: (next: { color: string; colorHex: string }) => void;
};

export default function ColorPalettePicker({
  color,
  colorHex,
  onChange,
}: Props) {
  const activeId = resolvePaletteId({ color, colorHex });

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
        Палітра згрупована за відтінками (як на бренд-дошці). Оберіть колір тут.
        Інші кольори цієї моделі — у «Повʼязані товари (інші кольори)».
      </p>

      <GroupedPaletteBoard
        lang="uk"
        mode="pick"
        activeId={activeId}
        onPick={(c) => onChange({ color: c.label, colorHex: c.hex })}
      />

      {activeId ? (
        <p className="text-[13px] text-gray-700 dark:text-gray-300">
          Обрано:{" "}
          <span className="font-medium">
            {COLOR_PALETTE.find((c) => c.id === activeId)?.label}
          </span>
          <span className="ml-2 font-mono text-[12px] text-gray-400">
            {colorHex}
          </span>
        </p>
      ) : (
        <p className="text-[13px] text-amber-700 dark:text-amber-400">
          Колір не з палітри — оберіть відтінок вище.
        </p>
      )}
    </div>
  );
}
