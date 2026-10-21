"use client";

import React from "react";
import { COLOR_PALETTE, resolvePaletteId } from "@/lib/colorPalette";

type Props = {
  color: string;
  colorHex: string;
  onChange: (next: { color: string; colorHex: string }) => void;
};

function isLightHex(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 210;
}

export default function ColorPalettePicker({
  color,
  colorHex,
  onChange,
}: Props) {
  const activeId = resolvePaletteId({ color, colorHex });

  return (
    <div className="space-y-4">
      <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
        Одна бренд-палітра для всіх товарів. Оберіть слот кольору — на сайті
        клієнт побачить усі крапки; інші кольори цього виробу додайте в
        «Повʼязані товари».
      </p>

      <div className="flex flex-wrap gap-1.5">
        {COLOR_PALETTE.map((c) => {
          const active = activeId === c.id;
          const swatchLight = isLightHex(c.hex);
          return (
            <button
              key={c.id}
              type="button"
              title={c.label}
              aria-pressed={active}
              onClick={() => onChange({ color: c.label, colorHex: c.hex })}
              className={`group relative size-7 rounded-full transition duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40 ${
                active
                  ? "ring-1 ring-gray-900/80 ring-offset-2 ring-offset-white dark:ring-white/70 dark:ring-offset-[#111]"
                  : "opacity-90 hover:scale-[1.06] hover:opacity-100"
              }`}
              style={{
                background:
                  c.id === "multi"
                    ? "conic-gradient(from 90deg, #c4c4c4, #8a8a8a, #d4c4a8, #a67b5b, #8a8a8a)"
                    : c.hex,
                boxShadow: swatchLight
                  ? "inset 0 0 0 1px rgba(0,0,0,0.08)"
                  : "inset 0 0 0 1px rgba(0,0,0,0.06)",
              }}
            >
              <span className="sr-only">{c.label}</span>
            </button>
          );
        })}
      </div>

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
          Колір не з палітри — оберіть слот вище, щоб товар потрапив у систему
          кольорів.
        </p>
      )}
    </div>
  );
}
