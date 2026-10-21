#!/usr/bin/env node
/**
 * Map free-form product colors onto the fixed brand palette (label + hex).
 */
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
const COLOR_PALETTE = [
  { id: "black", label: "Чорний", hex: "#111111" },
  { id: "white", label: "Білий", hex: "#F5F5F5" },
  { id: "ivory", label: "Слонова кістка", hex: "#F2EDE4" },
  { id: "beige", label: "Беж", hex: "#D4C4A8" },
  { id: "cream", label: "Кремовий", hex: "#E8DCC8" },
  { id: "sand", label: "Пісок", hex: "#C2A878" },
  { id: "camel", label: "Кемел", hex: "#A67B5B" },
  { id: "brown", label: "Коричневий", hex: "#5C4033" },
  { id: "chocolate", label: "Шоколад", hex: "#3D2314" },
  { id: "grey", label: "Сірий", hex: "#8A8A8A" },
  { id: "graphite", label: "Графіт", hex: "#4A4A4A" },
  { id: "silver", label: "Срібло", hex: "#C0C0C0" },
  { id: "red", label: "Червоний", hex: "#B91C1C" },
  { id: "burgundy", label: "Бордо", hex: "#6B1E2A" },
  { id: "pink", label: "Рожевий", hex: "#E8A0BF" },
  { id: "powder", label: "Пудра", hex: "#F2C4C4" },
  { id: "coral", label: "Корал", hex: "#E07A5F" },
  { id: "orange", label: "Помаранчевий", hex: "#E07B39" },
  { id: "mustard", label: "Гірчичний", hex: "#C4A035" },
  { id: "olive", label: "Оливковий", hex: "#6B7F3B" },
  { id: "khaki", label: "Хакі", hex: "#8A7E5A" },
  { id: "green", label: "Зелений", hex: "#2F6B4F" },
  { id: "mint", label: "Мʼятний", hex: "#B7E1DF" },
  { id: "blue", label: "Блакитний", hex: "#7EB6D9" },
  { id: "navy-blue", label: "Синій", hex: "#1E3A5F" },
  { id: "navy", label: "Navy", hex: "#0F1C2E" },
  { id: "purple", label: "Фіолетовий", hex: "#5B3A6E" },
  { id: "lavender", label: "Лаванда", hex: "#C5B4D6" },
  { id: "gold", label: "Золото", hex: "#C9A227" },
  { id: "multi", label: "Мульти", hex: "#FFFFFF" },
];

const LABEL_ALIASES = {
  чорний: "black",
  black: "black",
  білий: "white",
  white: "white",
  "слонова кістка": "ivory",
  беж: "beige",
  кремовий: "cream",
  пісок: "sand",
  кемел: "camel",
  коричневий: "brown",
  шоколад: "chocolate",
  сірий: "grey",
  gray: "grey",
  grey: "grey",
  графіт: "graphite",
  срібло: "silver",
  червоний: "red",
  бордо: "burgundy",
  рожевий: "pink",
  pink: "pink",
  фуксія: "pink",
  пудра: "powder",
  корал: "coral",
  помаранчевий: "orange",
  жовтий: "mustard",
  гірчичний: "mustard",
  оливковий: "olive",
  хакі: "khaki",
  зелений: "green",
  "м'ятний": "mint",
  "мʼятний": "mint",
  блакитний: "blue",
  синій: "navy-blue",
  navy: "navy",
  фіолетовий: "purple",
  чорничний: "purple",
  лаванда: "lavender",
  лавандовий: "lavender",
  золото: "gold",
  мульти: "multi",
  принт: "multi",
};

function normalizeHex(hex) {
  if (!hex) return null;
  let h = String(hex).trim().replace(/^#/, "").toUpperCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9A-F]{6}$/.test(h)) return null;
  return `#${h}`;
}

function hexDistance(a, b) {
  const pa = a.slice(1);
  const pb = b.slice(1);
  const dr = parseInt(pa.slice(0, 2), 16) - parseInt(pb.slice(0, 2), 16);
  const dg = parseInt(pa.slice(2, 4), 16) - parseInt(pb.slice(2, 4), 16);
  const db = parseInt(pa.slice(4, 6), 16) - parseInt(pb.slice(4, 6), 16);
  return dr * dr + dg * dg + db * db;
}

function resolve(color, colorHex) {
  const label = String(color || "").trim().toLowerCase();
  if (label && LABEL_ALIASES[label]) return LABEL_ALIASES[label];
  for (const c of COLOR_PALETTE) {
    if (c.label.toLowerCase() === label) return c.id;
  }
  const hex = normalizeHex(colorHex);
  if (!hex) return null;
  for (const c of COLOR_PALETTE) {
    if (normalizeHex(c.hex) === hex) return c.id;
  }
  let best = null;
  let bestDist = Infinity;
  for (const c of COLOR_PALETTE) {
    if (c.id === "multi") continue;
    const d = hexDistance(hex, c.hex);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  if (best && bestDist <= 40000) return best.id;
  return null;
}

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

const { rows } = await pool.query(
  `SELECT slug, color, color_hex FROM products WHERE color <> '' OR color_hex <> ''`
);

let updated = 0;
for (const row of rows) {
  const id = resolve(row.color, row.color_hex);
  if (!id) continue;
  const palette = COLOR_PALETTE.find((c) => c.id === id);
  if (!palette) continue;
  if (row.color === palette.label && normalizeHex(row.color_hex) === palette.hex) {
    continue;
  }
  await pool.query(
    `UPDATE products SET color = $2, color_hex = $3, updated_at = NOW() WHERE slug = $1`,
    [row.slug, palette.label, palette.hex]
  );
  updated++;
  console.log(`${row.slug}: ${row.color || "—"} → ${palette.label}`);
}

console.log(`Normalized ${updated} / ${rows.length} colored products`);
await pool.end();
