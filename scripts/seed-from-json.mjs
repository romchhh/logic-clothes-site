#!/usr/bin/env node
/**
 * npm run db:seed
 * Prefer `npm run db:import-catalog` for full catalog imports.
 * This seed loads data/products.json + data/orders.json with the current schema.
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
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

function readJson(rel, fallback) {
  const file = path.join(process.cwd(), rel);
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sizeOptionsOf(product) {
  const sizes = Array.isArray(product.sizeOptions)
    ? product.sizeOptions.filter(Boolean)
    : [];
  if (sizes.length) return sizes;
  if (/gift|certificate|сертифікат/i.test(`${product.id || ""} ${product.name || ""}`)) {
    return ["ONESIZE"];
  }
  return ["S", "M", "L"];
}

async function seedProducts(client, products) {
  await client.query(`DELETE FROM product_look_items`);
  await client.query(`DELETE FROM products`);
  let i = 0;
  for (const product of products) {
    const sizeOptions = sizeOptionsOf(product);
    await client.query(
      `
      INSERT INTO products (
        slug, name, name_en, sizes_display, price_num, price_label,
        price_eur, compare_at_price_num,
        color, color_hex, material,
        description, description_en, long_description, long_description_en,
        short_description, photo_size, model_params,
        in_stock, sku, category, is_new, is_popular, is_sale, color_group,
        sort_order, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,
        $9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,
        $26, NOW()
      )
      `,
      [
        product.id,
        product.name,
        product.nameEn || "",
        product.sizes || sizeOptions.join(" · "),
        product.priceNum,
        product.price,
        product.priceEur ?? null,
        product.compareAtPriceNum ?? null,
        product.color || "",
        product.colorHex || "",
        product.material || "",
        product.description || "",
        product.descriptionEn || "",
        product.longDescription || "",
        product.longDescriptionEn || "",
        product.shortDescription ?? null,
        product.photoSize || "",
        product.modelParams || "",
        product.inStock !== false,
        String(product.sku ?? product.id),
        product.category ?? null,
        Boolean(product.isNew),
        Boolean(product.isPopular),
        Boolean(product.isSale),
        product.colorGroup ?? null,
        product.sortOrder ?? i++,
      ]
    );

    for (let s = 0; s < sizeOptions.length; s++) {
      await client.query(
        `INSERT INTO product_size_options (product_slug, size, sort_order) VALUES ($1,$2,$3)`,
        [product.id, sizeOptions[s], s]
      );
    }

    const images = product.images || [];
    for (let img = 0; img < images.length; img++) {
      await client.query(
        `INSERT INTO product_images (product_slug, url, sort_order, media_type)
         VALUES ($1,$2,$3,'image')`,
        [product.id, images[img], img]
      );
    }

    const swatches = product.swatches || [];
    for (let sw = 0; sw < swatches.length; sw++) {
      await client.query(
        `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          product.id,
          swatches[sw].img || images[0] || "",
          swatches[sw].label,
          swatches[sw].hex ?? null,
          sw,
        ]
      );
    }
  }
}

async function seedOrders(client, orders) {
  await client.query(`DELETE FROM orders`);
  for (const order of orders) {
    await client.query(
      `
      INSERT INTO orders (
        id, created_at, status, customer_name, phone, email,
        delivery_method, city, address, comment, locale, total, notified
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12,$13
      )
      `,
      [
        order.id,
        order.createdAt || new Date().toISOString(),
        order.status || "new",
        order.customerName,
        order.phone,
        order.email ?? null,
        order.deliveryMethod,
        order.city,
        order.address,
        order.comment ?? null,
        order.locale || "uk",
        order.total ?? 0,
        Boolean(order.notified),
      ]
    );

    for (const item of order.items || []) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, name, size, quantity, price_num)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          order.id,
          item.productId,
          item.name,
          item.size,
          item.quantity,
          item.priceNum,
        ]
      );
    }
  }
}

async function main() {
  const products = readJson("data/products.json", []);
  const orders = readJson("data/orders.json", []);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await seedProducts(client, products);
    await seedOrders(client, orders);

    await client.query(
      `UPDATE products
       SET in_stock = FALSE, is_popular = FALSE, is_new = FALSE,
           price_num = 0, price_label = '0 грн'
       WHERE slug ILIKE '%gift%' OR name ILIKE '%gift%' OR name ILIKE '%сертифікат%'`
    );
    await client.query(`UPDATE products SET is_new = FALSE`);
    await client.query(`
      UPDATE products SET is_new = TRUE
      WHERE slug IN (
        SELECT slug FROM products
        WHERE price_num > 0 AND slug NOT ILIKE '%gift%'
        ORDER BY sort_order DESC
        LIMIT 28
      )
    `);

    await client.query("COMMIT");
    console.log(
      `Seeded ${products.length} products and ${orders.length} orders.`
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
