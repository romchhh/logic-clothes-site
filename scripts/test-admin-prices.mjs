#!/usr/bin/env node
/**
 * Smoke test: products.price_usd column + round-trip EUR/USD update.
 * npm run test:admin-prices
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 0) continue;
      const key = t.slice(0, eq).trim();
      let value = t.slice(eq + 1).trim();
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

async function main() {
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS price_usd NUMERIC(12, 2)
  `);

  const pick = await pool.query(
    `SELECT slug, price_eur, price_usd FROM products ORDER BY sort_order ASC LIMIT 1`
  );
  if (!pick.rows[0]) {
    console.log("skip: no products in DB");
    return;
  }
  const { slug, price_eur: origEur, price_usd: origUsd } = pick.rows[0];
  const testEur = 77;
  const testUsd = 88;

  await pool.query(
    `UPDATE products SET price_eur = $2, price_usd = $3, updated_at = NOW() WHERE slug = $1`,
    [slug, testEur, testUsd]
  );
  const row = await pool.query(
    `SELECT price_eur, price_usd FROM products WHERE slug = $1`,
    [slug]
  );
  const eur = Number(row.rows[0].price_eur);
  const usd = Number(row.rows[0].price_usd);
  if (eur !== testEur || usd !== testUsd) {
    throw new Error(`round-trip failed: got eur=${eur} usd=${usd}`);
  }

  await pool.query(
    `UPDATE products SET price_eur = $2, price_usd = $3, updated_at = NOW() WHERE slug = $1`,
    [slug, origEur, origUsd]
  );

  console.log(`ok: price_usd column + round-trip on «${slug}»`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
