#!/usr/bin/env node
/**
 * Repair product_images / product_swatches URLs from data/products.json.
 * Fixes legacy paths like /assets/products/yellowshirt_1.jpg → yellowshirt_034_1.jpg
 *
 *   npm run db:fix-images
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

function readProducts() {
  const file = path.join(process.cwd(), "data", "products.json");
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const PRODUCTS_DIR = path.join(process.cwd(), "public", "assets", "products");
const fileIndex = new Map();

function buildFileIndex() {
  if (!fs.existsSync(PRODUCTS_DIR)) return;
  for (const name of fs.readdirSync(PRODUCTS_DIR)) {
    if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
    const base = name.replace(/_\d+_1\.(jpe?g|png|webp)$/i, "");
    if (!fileIndex.has(base)) fileIndex.set(base, []);
    fileIndex.get(base).push(`/assets/products/${name}`);
  }
}

function resolveLegacyUrl(url, slug) {
  const base = path.basename(url);
  const full = path.join(PRODUCTS_DIR, base);
  if (fs.existsSync(full)) return url;

  const candidates = fileIndex.get(slug) || [];
  if (candidates.length) return candidates[0];

  const stem = base.replace(/_1\.(jpe?g|png|webp)$/i, "");
  const fuzzy = fileIndex.get(stem) || [];
  return fuzzy[0] || url;
}

async function syncMedia(client, product) {
  const slug = product.id;
  const { rows } = await client.query(
    `SELECT 1 FROM products WHERE slug = $1`,
    [slug]
  );
  if (!rows.length) return false;

  await client.query(`DELETE FROM product_images WHERE product_slug = $1`, [
    slug,
  ]);
  await client.query(`DELETE FROM product_swatches WHERE product_slug = $1`, [
    slug,
  ]);

  const images = product.images || [];
  for (let i = 0; i < images.length; i++) {
    await client.query(
      `INSERT INTO product_images (product_slug, url, sort_order, media_type)
       VALUES ($1, $2, $3, 'image')`,
      [slug, images[i], i]
    );
  }

  const swatches = product.swatches || [];
  for (let i = 0; i < swatches.length; i++) {
    const s = swatches[i];
    await client.query(
      `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        slug,
        s.img || images[0] || "",
        s.label || "",
        s.hex ?? null,
        i,
      ]
    );
  }

  return true;
}

function assetExists(url) {
  if (!url?.startsWith("/")) return false;
  return fs.existsSync(path.join(process.cwd(), "public", url.slice(1)));
}

async function repairLegacyRows(client) {
  const { rows } = await client.query(`
    SELECT id, product_slug, url, sort_order
    FROM product_images
    WHERE url LIKE '/assets/products/%'
    ORDER BY product_slug, sort_order, id
  `);
  let fixed = 0;
  for (const row of rows) {
    let next = row.url;
    if (!assetExists(next)) {
      next = resolveLegacyUrl(row.url, row.product_slug);
    }
    if (next === row.url) continue;
    if (!assetExists(next)) continue;
    await client.query(`UPDATE product_images SET url = $1 WHERE id = $2`, [
      next,
      row.id,
    ]);
    fixed += 1;
  }
  return fixed;
}

async function main() {
  buildFileIndex();
  const products = readProducts();
  const client = await pool.connect();
  let updated = 0;
  try {
    await client.query("BEGIN");
    for (const product of products) {
      if (await syncMedia(client, product)) updated += 1;
    }
    const legacyFixed = await repairLegacyRows(client);
    await client.query("COMMIT");
    console.log(
      `Synced images for ${updated} products from data/products.json; repaired ${legacyFixed} legacy URLs.`
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
