#!/usr/bin/env node
/**
 * One-shot data hygiene: sizes, gift cert, category labels, broken swatches.
 */
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";

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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE categories
       SET label_uk = $2, label_en = $3, updated_at = NOW()
       WHERE id = $1`,
      ["all", "Усі товари", "All"]
    );

    const gift = await client.query(
      `UPDATE products
       SET in_stock = FALSE,
           is_popular = FALSE,
           is_new = FALSE,
           price_num = 0,
           price_label = '0 грн'
       WHERE slug ILIKE '%gift%' OR name ILIKE '%gift%' OR name ILIKE '%сертифікат%'
       RETURNING slug`
    );

    const empty = await client.query(`
      SELECT p.slug
      FROM products p
      LEFT JOIN product_size_options s ON s.product_slug = p.slug
      GROUP BY p.slug
      HAVING COUNT(s.size) = 0
    `);

    let sizesFilled = 0;
    for (const row of empty.rows) {
      for (const [i, size] of ["S", "M", "L"].entries()) {
        await client.query(
          `INSERT INTO product_size_options (product_slug, size, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [row.slug, size, i]
        );
      }
      await client.query(
        `UPDATE products
         SET sizes_display = COALESCE(NULLIF(sizes_display, ''), 'S · M · L')
         WHERE slug = $1`,
        [row.slug]
      );
      sizesFilled++;
    }

    const swatches = await client.query(`
      UPDATE product_swatches ps
      SET img = COALESCE(
        (
          SELECT pi.url
          FROM product_images pi
          WHERE pi.product_slug = ps.product_slug
          ORDER BY pi.sort_order ASC
          LIMIT 1
        ),
        ps.img
      )
      WHERE ps.img IS NULL
         OR ps.img = ''
         OR ps.img LIKE '%undefined%'
      RETURNING product_slug
    `);

    await client.query("COMMIT");

    console.log(
      JSON.stringify(
        {
          giftHidden: gift.rows.map((r) => r.slug),
          sizesFilled,
          swatchesFixed: swatches.rowCount,
          allLabel: (
            await pool.query(
              `SELECT label_uk, label_en FROM categories WHERE id = 'all'`
            )
          ).rows[0],
        },
        null,
        2
      )
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
