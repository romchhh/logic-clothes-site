"use client";

import { SIZE_ROW_BASE, SIZE_ROW_MORE } from "@/lib/productSizes";

const ROWS = [
  { id: "base", label: "base", sizes: SIZE_ROW_BASE },
  { id: "more", label: "more", sizes: SIZE_ROW_MORE },
] as const;

const WIDE = new Set<string>(["ONESIZE", "ONESIZE+"]);
const LETTERS = new Set<string>(["A", "B", "C", "D"]);

function tileLabel(size: string): string {
  switch (size) {
    case "ONESIZE":
      return "onesize";
    case "ONESIZE+":
      return "ONESIZE +";
    case "XS-S":
      return "xs - s";
    case "S-M":
      return "s - m";
    case "M-L":
      return "m - l";
    case "L-XL":
      return "l - xl";
    default:
      return size;
  }
}

export default function ProductSizeBoard({
  inStock,
  selected,
  pinned = null,
  mode = "pdp",
  onSelect,
  extraSizes = [],
}: {
  inStock: ReadonlySet<string>;
  selected: string | null;
  /** Out-of-stock size tapped for made-to-order (PDP only). */
  pinned?: string | null;
  mode?: "pdp" | "builder";
  onSelect: (size: string, stocked: boolean) => void;
  /** Sizes outside the two brand rows, shown on the more line. */
  extraSizes?: string[];
}) {
  const moreExtras = extraSizes.filter(
    (size) =>
      !(SIZE_ROW_BASE as readonly string[]).includes(size) &&
      !(SIZE_ROW_MORE as readonly string[]).includes(size)
  );

  return (
    <div className="pdp-size-board">
      {ROWS.map((row) => {
        const sizes =
          row.id === "more" ? [...row.sizes, ...moreExtras] : [...row.sizes];
        return (
          <div key={row.id} className="pdp-size-board-group">
            <p className="pdp-size-board-label">{row.label}</p>
            <div
              className="pdp-size-board-row"
              role="listbox"
              aria-label={row.label}
            >
              {sizes.map((sz) => {
                const stocked =
                  mode === "builder" ? true : inStock.has(sz);
                const active = stocked && selected === sz;
                const isPinned =
                  mode === "pdp" && !stocked && pinned === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    role="option"
                    aria-selected={active || isPinned}
                    className={[
                      "pdp-size-tile",
                      WIDE.has(sz) ? "is-wide" : "",
                      LETTERS.has(sz) ? "is-letter" : "",
                      stocked ? "is-stocked" : "is-off",
                      active ? "is-active" : "",
                      isPinned ? "is-pinned" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => onSelect(sz, stocked)}
                  >
                    {tileLabel(sz)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
