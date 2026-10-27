"use client";

import {
  getPaletteGroups,
  type PaletteColor,
} from "@/lib/colorPalette";
import { paintSwatchShape } from "@/lib/paletteSwatchShape";
import type { Locale } from "@/lib/i18n/config";

function swatchBackground(c: PaletteColor): string {
  if (c.id === "multi") {
    return "conic-gradient(from 120deg, #c4c4c4, #8a8a8a, #d4c4a8, #e07b39, #8a8a8a, #c4c4c4)";
  }
  return c.hex;
}

type Props = {
  lang?: Locale;
  activeId?: string | null;
  /** Multi-select: highlight all chosen palette ids */
  activeIds?: string[] | null;
  mode: "pick" | "display";
  onPick?: (color: PaletteColor) => void;
  className?: string;
};

export default function GroupedPaletteBoard({
  lang = "uk",
  activeId = null,
  activeIds = null,
  mode,
  onPick,
  className = "",
}: Props) {
  const isActive = (id: string) =>
    activeIds && activeIds.length > 0
      ? activeIds.includes(id)
      : activeId === id;
  const groups = getPaletteGroups();
  let shapeIndex = 0;

  return (
    <div
      className={`palette-board${className ? ` ${className}` : ""}`}
      role={mode === "pick" ? "group" : "list"}
      aria-label={lang === "en" ? "Color palette" : "Палітра кольорів"}
    >
      {groups.map((group) => {
        const groupLabel = lang === "en" ? group.labelEn : group.label;
        return (
          <div key={group.id} className="palette-group" role="listitem">
            <p className="palette-group-label">{groupLabel}</p>
            <div className="palette-group-grid">
              {group.shades.map((c) => {
                const label = lang === "en" ? c.labelEn : c.label;
                const active = isActive(c.id);
                const shape = paintSwatchShape(shapeIndex++);
                const style = {
                  background: swatchBackground(c),
                  borderRadius: shape.borderRadius,
                  transform: shape.transform,
                };

                const className = `palette-swatch${active ? " is-active" : ""}${
                  c.id === "multi" ? " is-multi" : ""
                }`;

                if (mode === "pick") {
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={active}
                      className={className}
                      style={style}
                      onClick={() => onPick?.(c)}
                    >
                      <span className="palette-swatch-paint" aria-hidden="true" />
                    </button>
                  );
                }

                return (
                  <span
                    key={c.id}
                    role="img"
                    aria-label={label}
                    className={className}
                    style={style}
                  >
                    <span className="palette-swatch-paint" aria-hidden="true" />
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
