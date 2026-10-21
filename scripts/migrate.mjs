#!/usr/bin/env node
/**
 * npm run migrate
 * Applies database/schema.sql and tracks versions in _migrations.
 */
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (.env.local / .env)");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

const migrations = [
  {
    id: "2026-04-21_lc_initial_schema",
    description: "Initial products + orders schema",
    file: "database/schema.sql",
  },
  {
    id: "2026-04-21_lc_categories",
    description: "Categories table + seed",
    file: "database/migrations/2026-04-21_lc_categories.sql",
  },
  {
    id: "2026-04-21_lc_product_relations",
    description: "Color groups + look items",
    file: "database/migrations/2026-04-21_lc_product_relations.sql",
  },
  {
    id: "2026-04-21_lc_site_settings",
    description: "Site settings for API keys / integrations",
    file: "database/migrations/2026-04-21_lc_site_settings.sql",
  },
  {
    id: "2026-04-21_lc_product_admin_v2",
    description: "Bilingual products, prices, flags, media meta",
    file: "database/migrations/2026-04-21_lc_product_admin_v2.sql",
  },
  {
    id: "2026-10-21_lc_clothing_categories",
    description: "Apparel categories + covers aligned to catalog",
    file: "database/migrations/2026-10-21_lc_clothing_categories.sql",
  },
  {
    id: "2026-10-21_lc_product_length_material",
    description: "Length and material variation options",
    file: "database/migrations/2026-10-21_lc_product_length_material.sql",
  },
  {
    id: "2026-10-21_lc_order_item_variants",
    description: "Order line color / length / material fields",
    file: "database/migrations/2026-10-21_lc_order_item_variants.sql",
  },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const migration of migrations) {
      const { rows } = await client.query(
        `SELECT 1 FROM _migrations WHERE id = $1`,
        [migration.id]
      );
      if (rows.length) {
        console.log(`skip  ${migration.id}`);
        continue;
      }

      const sqlPath = path.join(process.cwd(), migration.file);
      const sql = fs.readFileSync(sqlPath, "utf8");
      console.log(`apply ${migration.id} — ${migration.description}`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO _migrations (id) VALUES ($1)`, [
          migration.id,
        ]);
        await client.query("COMMIT");
        console.log(`ok    ${migration.id}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }

    console.log("Migrate complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
