import "./jost.css";

/**
 * Self-hosted Jost — avoids next/font/google build crashes when the
 * server cannot reach fonts.googleapis.com (empty CSS → loader null).
 */
export const jost = {
  className: "font-jost",
  variable: "font-jost-var",
} as const;
