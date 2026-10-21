#!/usr/bin/env node
/**
 * Import catalog dump into Postgres (replaces catalog tables).
 *
 *   npm run db:import
 *   npm run db:import -- --file data/catalog-dump.json
 *   TARGET_DATABASE_URL=... npm run db:import
 *
 * Does NOT touch orders. Settings imported only if dump was exported with
 * --with-settings (and not --skip-settings).
 */
import fs from "node:fs";
import path from "node:path";
import {
  argFlag,
  argValue,
  loadEnv,
  makePool,
} from "./_pg.mjs";

loadEnv();

const fileRel = argValue("--file", "data/catalog-dump.json");
const skipSettings = argFlag("--skip-settings");
const dryRun = argFlag("--dry-run");
const targetUrl =
  process.env.TARGET_DATABASE_URL || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error("DATABASE_URL (or TARGET_DATABASE_URL) is not set");
  process.exit(1);
}

function readDump(rel) {
  const file = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) {
    throw new Error(`Dump not found: ${file}\nRun: npm run db:export`);
  }
  return { file, dump: JSON.parse(fs.readFileSync(file, "utf8")) };
}

async function clearCatalog(client) {
  await client.query(`DELETE FROM product_look_items`);
  await client.query(`DELETE FROM product_material_options`);
  await client.query(`DELETE FROM product_length_options`);
  await client.query(`DELETE FROM product_swatches`);
  await client.query(`DELETE FROM product_images`);
  await client.query(`DELETE FROM product_size_options`);
  await client.query(`DELETE FROM products`);
  await client.query(`DELETE FROM categories`);
}

async function importCatalog(client, dump) {
  for (const c of dump.categories || []) {
    await client.query(
      `INSERT INTO categories (
         id, image, label_uk, label_en, cta_uk, cta_en, kind,
         sort_order, is_visible, is_system, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,
         $8,$9,$10,
         COALESCE($11::timestamptz, NOW()),
         COALESCE($12::timestamptz, NOW())
       )`,
      [
        c.id,
        c.image || "",
        c.label_uk,
        c.label_en,
        c.cta_uk || "До категорії",
        c.cta_en || "Shop now",
        c.kind || "category",
        c.sort_order ?? 0,
        c.is_visible !== false,
        Boolean(c.is_system),
        c.created_at ?? null,
        c.updated_at ?? null,
      ]
    );
  }

  for (const p of dump.products || []) {
    await client.query(
      `INSERT INTO products (
         slug, name, name_en, sizes_display, price_num, price_label,
         price_eur, compare_at_price_num,
         color, color_hex, material,
         description, description_en, long_description, long_description_en,
         short_description, photo_size, model_params,
         in_stock, sku, category, is_new, is_popular, is_sale, color_group,
         sort_order, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,
         $7,$8,
         $9,$10,$11,
         $12,$13,$14,$15,
         $16,$17,$18,
         $19,$20,$21,$22,$23,$24,$25,
         $26,
         COALESCE($27::timestamptz, NOW()),
         COALESCE($28::timestamptz, NOW())
       )`,
      [
        p.slug,
        p.name,
        p.name_en || "",
        p.sizes_display || "",
        p.price_num,
        p.price_label,
        p.price_eur ?? null,
        p.compare_at_price_num ?? null,
        p.color || "",
        p.color_hex || "",
        p.material || "",
        p.description || "",
        p.description_en || "",
        p.long_description || "",
        p.long_description_en || "",
        p.short_description ?? null,
        p.photo_size || "",
        p.model_params || "",
        p.in_stock !== false,
        p.sku || p.slug,
        p.category ?? null,
        Boolean(p.is_new),
        Boolean(p.is_popular),
        Boolean(p.is_sale),
        p.color_group ?? null,
        p.sort_order ?? 0,
        p.created_at ?? null,
        p.updated_at ?? null,
      ]
    );
  }

  for (const row of dump.sizeOptions || []) {
    await client.query(
      `INSERT INTO product_size_options (product_slug, size, sort_order)
       VALUES ($1,$2,$3)`,
      [row.product_slug, row.size, row.sort_order ?? 0]
    );
  }
  for (const row of dump.lengthOptions || []) {
    await client.query(
      `INSERT INTO product_length_options (product_slug, value, sort_order)
       VALUES ($1,$2,$3)`,
      [row.product_slug, row.value, row.sort_order ?? 0]
    );
  }
  for (const row of dump.materialOptions || []) {
    await client.query(
      `INSERT INTO product_material_options (product_slug, value, sort_order)
       VALUES ($1,$2,$3)`,
      [row.product_slug, row.value, row.sort_order ?? 0]
    );
  }
  for (const row of dump.images || []) {
    await client.query(
      `INSERT INTO product_images
         (product_slug, url, sort_order, media_type, width, height)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        row.product_slug,
        row.url,
        row.sort_order ?? 0,
        row.media_type || "image",
        row.width ?? null,
        row.height ?? null,
      ]
    );
  }
  for (const row of dump.swatches || []) {
    await client.query(
      `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        row.product_slug,
        row.img || "",
        row.label,
        row.hex ?? null,
        row.sort_order ?? 0,
      ]
    );
  }
  for (const row of dump.lookItems || []) {
    await client.query(
      `INSERT INTO product_look_items (product_slug, related_slug, sort_order)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [row.product_slug, row.related_slug, row.sort_order ?? 0]
    );
  }

  if (
    !skipSettings &&
    dump.withSettings &&
    Array.isArray(dump.settings) &&
    dump.settings.length
  ) {
    for (const s of dump.settings) {
      await client.query(
        `INSERT INTO site_settings (key, value, updated_at)
         VALUES ($1, $2, COALESCE($3::timestamptz, NOW()))
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           updated_at = EXCLUDED.updated_at`,
        [s.key, s.value ?? "", s.updated_at ?? null]
      );
    }
  }
}

async function main() {
  const { file, dump } = readDump(fileRel);
  console.log(`Dump: ${file}`);
  console.log(`Exported at: ${dump.exportedAt || "?"}`);
  console.log(dump.counts || {});

  if (dryRun) {
    console.log("Dry run — no writes.");
    return;
  }

  const pool = makePool(targetUrl);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await clearCatalog(client);
    await importCatalog(client, dump);
    await client.query("COMMIT");
    console.log(
      `Imported ${(dump.products || []).length} products, ${(dump.categories || []).length} categories.`
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
