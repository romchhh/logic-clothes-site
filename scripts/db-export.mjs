#!/usr/bin/env node
/**
 * Export catalog from Postgres → JSON dump.
 *
 *   npm run db:export
 *   npm run db:export -- --out data/catalog-dump.json
 *   npm run db:export -- --with-settings
 *
 * Uses DATABASE_URL from .env.local / .env
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

const outRel = argValue("--out", "data/catalog-dump.json");
const withSettings = argFlag("--with-settings");
const sourceUrl = process.env.SOURCE_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceUrl) {
  console.error("DATABASE_URL (or SOURCE_DATABASE_URL) is not set");
  process.exit(1);
}

async function exportCatalog(client) {
  const { rows: categories } = await client.query(
    `SELECT id, image, label_uk, label_en, cta_uk, cta_en, kind,
            sort_order, is_visible, is_system, created_at, updated_at
     FROM categories
     ORDER BY sort_order ASC, id ASC`
  );

  const { rows: products } = await client.query(
    `SELECT *
     FROM products
     ORDER BY sort_order ASC, created_at DESC, slug ASC`
  );

  const { rows: sizeOptions } = await client.query(
    `SELECT product_slug, size, sort_order
     FROM product_size_options
     ORDER BY product_slug, sort_order, size`
  );
  const { rows: lengthOptions } = await client.query(
    `SELECT product_slug, value, sort_order
     FROM product_length_options
     ORDER BY product_slug, sort_order, value`
  );
  const { rows: materialOptions } = await client.query(
    `SELECT product_slug, value, sort_order
     FROM product_material_options
     ORDER BY product_slug, sort_order, value`
  );
  const { rows: images } = await client.query(
    `SELECT product_slug, url, sort_order, media_type, width, height
     FROM product_images
     ORDER BY product_slug, sort_order, id`
  );
  const { rows: swatches } = await client.query(
    `SELECT product_slug, img, label, hex, sort_order
     FROM product_swatches
     ORDER BY product_slug, sort_order, id`
  );
  const { rows: lookItems } = await client.query(
    `SELECT product_slug, related_slug, sort_order
     FROM product_look_items
     ORDER BY product_slug, sort_order, related_slug`
  );

  let settings = [];
  if (withSettings) {
    const res = await client.query(
      `SELECT key, value, updated_at FROM site_settings ORDER BY key`
    );
    settings = res.rows;
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    withSettings,
    counts: {
      categories: categories.length,
      products: products.length,
      sizeOptions: sizeOptions.length,
      lengthOptions: lengthOptions.length,
      materialOptions: materialOptions.length,
      images: images.length,
      swatches: swatches.length,
      lookItems: lookItems.length,
      settings: settings.length,
    },
    categories,
    products,
    sizeOptions,
    lengthOptions,
    materialOptions,
    images,
    swatches,
    lookItems,
    settings,
  };
}

async function main() {
  const pool = makePool(sourceUrl);
  const client = await pool.connect();
  try {
    const dump = await exportCatalog(client);
    const outPath = path.isAbsolute(outRel)
      ? outRel
      : path.join(process.cwd(), outRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(dump, null, 2), "utf8");
    console.log(`Exported → ${outPath}`);
    console.log(dump.counts);
    if (!withSettings) {
      console.log("(site_settings skipped — pass --with-settings to include)");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
