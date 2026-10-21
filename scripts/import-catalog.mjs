#!/usr/bin/env node
/**
 * npm run db:import-catalog
 *
 * Imports root products.json + images/ into Postgres and public/assets/products.
 * Replaces all products (orders / settings / categories rows kept; category covers updated).
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

const ROOT = process.cwd();
const SRC_JSON_ROOT = path.join(ROOT, "products.json");
const SRC_JSON_DATA = path.join(ROOT, "data", "products.json");
const SRC_IMAGES = path.join(ROOT, "images");
const DEST_IMAGES = path.join(ROOT, "public", "assets", "products");
const LEGACY_JSON = SRC_JSON_DATA;

const CATEGORY_RULES = [
  [/gift|certificate|сертифікат/i, "accessories"],
  [/scarf|belt|peplum|bag|shopper|gloves|collar|шопер|аксесуар|plakhta/i, "accessories"],
  [/dress|сукн|gown/i, "dresses"],
  [/skirt|trousers|pants|culottes|shorts|штан|спідниц|jeans|denim.*pant/i, "bottoms"],
  [/jacket|coat|trench|bomber|hoodie|sweat|vest|park|raincoat|blazer|кардиг|пілотк|дубльон/i, "outerwear"],
  [/shirt|blouse|top|crop|tee|майк|pajama|піжам|jumpsuit|set|комплект/i, "tops"],
];

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "product";
}

function formatPriceLabel(n) {
  return `${Number(n).toLocaleString("uk-UA")} ₴`;
}

function extractMaterial(text) {
  if (!text) return "";
  const m = String(text).match(
    /(?:composition|fabric|склад)\s*[:：]\s*([^.]+)/i
  );
  return m ? m[1].trim() : "";
}

function sizeOptionsFrom(raw) {
  const attrs = Array.isArray(raw.attributes) ? raw.attributes : [];
  const sizeAttr = attrs.find((a) => /size/i.test(String(a?.name || "")));
  const opts = Array.isArray(sizeAttr?.options) ? sizeAttr.options : [];
  const parsed = opts
    .map((s) => {
      const t = String(s).trim();
      if (/^onesize$/i.test(t)) return "ONESIZE";
      return t;
    })
    .filter(Boolean);
  if (parsed.length) return parsed;
  // Clothing defaults when source listing has no size attribute
  if (/gift|certificate|сертифікат/i.test(`${raw.slug || ""} ${raw.name || ""}`)) {
    return ["ONESIZE"];
  }
  return ["S", "M", "L"];
}

function inferCategory(raw, legacyMap) {
  const slug = String(raw.slug || "");
  if (legacyMap[slug]) return legacyMap[slug];

  const fromCats = Array.isArray(raw.categories) ? raw.categories : [];
  for (const c of fromCats) {
    const label = typeof c === "string" ? c : c?.name || c?.slug || "";
    const hay = String(label);
    for (const [re, id] of CATEGORY_RULES) {
      if (re.test(hay)) return id;
    }
  }

  const hay = `${slug} ${raw.name || ""}`;
  for (const [re, id] of CATEGORY_RULES) {
    if (re.test(hay)) return id;
  }
  return "accessories";
}

function copyImages() {
  fs.mkdirSync(DEST_IMAGES, { recursive: true });
  if (!fs.existsSync(SRC_IMAGES)) {
    console.warn("No images/ folder — skipping image copy");
    return 0;
  }
  let n = 0;
  for (const name of fs.readdirSync(SRC_IMAGES)) {
    const src = path.join(SRC_IMAGES, name);
    if (!fs.statSync(src).isFile()) continue;
    fs.copyFileSync(src, path.join(DEST_IMAGES, name));
    n++;
  }
  return n;
}

function transformProducts(rawList, legacyMap) {
  const used = new Set();
  const out = [];

  for (const raw of rawList) {
    let id = slugify(raw.slug || raw.name);
    if (used.has(id)) id = `${id}-${used.size}`;
    used.add(id);

    const priceNum = Number(String(raw.price ?? "").replace(/[^\d.]/g, "")) || 0;
    const compareAt =
      Number(String(raw.regular_price ?? "").replace(/[^\d.]/g, "")) || null;
    const sale =
      Number(String(raw.sale_price ?? "").replace(/[^\d.]/g, "")) || null;

    const sizeOptions = sizeOptionsFrom(raw);
    const desc = String(raw.description || raw.short_description || "").trim();
    const material = extractMaterial(desc);

    const images = (raw.images || [])
      .map((img) => {
        const base = path.basename(String(img));
        return base ? `/assets/products/${base}` : null;
      })
      .filter(Boolean);

    const category = inferCategory(raw, legacyMap);
    const legacy = legacyMap.__full?.[id];
    const isNew = Boolean(legacy?.isNew);

    out.push({
      id,
      name: String(raw.name || id).trim(),
      nameEn: String(raw.name || id).trim(),
      sizes: sizeOptions.join(" · "),
      sizeOptions,
      priceNum,
      price: formatPriceLabel(priceNum),
      priceEur: null,
      compareAtPriceNum:
        compareAt && compareAt > priceNum
          ? compareAt
          : sale && sale < priceNum
            ? priceNum
            : null,
      color: legacy?.color || "",
      colorHex: legacy?.swatches?.[0]?.hex || "",
      material: material || legacy?.material || "",
      description: desc,
      descriptionEn: desc,
      longDescription: desc,
      longDescriptionEn: desc,
      shortDescription: String(raw.short_description || "").trim() || null,
      inStock: raw.in_stock !== false && raw.in_stock !== null ? true : priceNum > 0,
      sku: raw.sku != null && raw.sku !== "" ? raw.sku : id,
      category,
      isNew,
      isPopular: false,
      isSale: Boolean(
        (compareAt && compareAt > priceNum) || (sale && sale > 0 && sale < priceNum)
      ),
      images,
      swatches: legacy?.swatches || [],
    });
  }

  return out;
}

async function seedProducts(client, products) {
  await client.query(`DELETE FROM product_look_items`);
  await client.query(`DELETE FROM products`);

  let i = 0;
  for (const product of products) {
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
        product.sizes || product.sizeOptions.join(" · "),
        product.priceNum,
        product.price,
        product.priceEur,
        product.compareAtPriceNum,
        product.color || "",
        product.colorHex || "",
        product.material || "",
        product.description || "",
        product.descriptionEn || "",
        product.longDescription || "",
        product.longDescriptionEn || "",
        product.shortDescription,
        "",
        "",
        product.inStock !== false,
        String(product.sku ?? product.id),
        product.category ?? null,
        Boolean(product.isNew),
        Boolean(product.isPopular),
        Boolean(product.isSale),
        null,
        i++,
      ]
    );

    for (let s = 0; s < product.sizeOptions.length; s++) {
      await client.query(
        `INSERT INTO product_size_options (product_slug, size, sort_order) VALUES ($1,$2,$3)`,
        [product.id, product.sizeOptions[s], s]
      );
    }

    for (let img = 0; img < product.images.length; img++) {
      await client.query(
        `INSERT INTO product_images (product_slug, url, sort_order, media_type)
         VALUES ($1,$2,$3,'image')`,
        [product.id, product.images[img], img]
      );
    }

    for (let sw = 0; sw < (product.swatches || []).length; sw++) {
      const row = product.swatches[sw];
      await client.query(
        `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [product.id, row.img, row.label, row.hex ?? null, sw]
      );
    }
  }
}

async function refreshCategoryCovers(client, products) {
  /** Prefer later items (higher sort index) and skip gift certificates. */
  const ranked = [...products].reverse();
  const byCat = new Map();
  for (const p of ranked) {
    if (!p.category || !p.images?.[0]) continue;
    if (/gift/i.test(p.id) || /gift/i.test(p.name || "")) continue;
    if (!byCat.has(p.category)) byCat.set(p.category, p.images[0]);
  }

  const collectionCovers = {
    all: byCat.get("dresses") || byCat.get("outerwear") || [...byCat.values()][0],
    new: byCat.get("outerwear") || byCat.get("dresses") || [...byCat.values()][0],
  };

  for (const [id, image] of Object.entries(collectionCovers)) {
    if (!image) continue;
    await client.query(
      `UPDATE categories SET image = $2, updated_at = NOW() WHERE id = $1`,
      [id, image]
    );
  }

  for (const [id, image] of byCat) {
    await client.query(
      `UPDATE categories SET image = $2, updated_at = NOW()
       WHERE id = $1 AND kind = 'category'`,
      [id, image]
    );
  }
}

function isScrapedFormat(list) {
  return (
    Array.isArray(list) &&
    list.length > 0 &&
    list[0] &&
    ("slug" in list[0] || "image_urls" in list[0]) &&
    !("priceNum" in list[0])
  );
}

async function main() {
  const srcJson = fs.existsSync(SRC_JSON_ROOT)
    ? SRC_JSON_ROOT
    : fs.existsSync(SRC_JSON_DATA)
      ? SRC_JSON_DATA
      : null;
  if (!srcJson) {
    console.error("No products.json found (root or data/)");
    process.exit(1);
  }

  const copied = copyImages();
  console.log(`Copied ${copied} images → public/assets/products`);

  const rawList = readJson(srcJson, []);
  const legacyList = readJson(LEGACY_JSON, []);
  const legacyMap = Object.fromEntries(
    legacyList.map((p) => [p.id, p.category])
  );
  legacyMap.__full = Object.fromEntries(legacyList.map((p) => [p.id, p]));

  let products = isScrapedFormat(rawList)
    ? transformProducts(rawList, legacyMap)
    : rawList.map((p, i) => {
        const sizeOptions =
          Array.isArray(p.sizeOptions) && p.sizeOptions.length
            ? p.sizeOptions
            : /gift|certificate|сертифікат/i.test(`${p.id || ""} ${p.name || ""}`)
              ? ["ONESIZE"]
              : ["S", "M", "L"];
        return {
          ...p,
          id: p.id,
          nameEn: p.nameEn || p.name,
          descriptionEn: p.descriptionEn || p.description || "",
          longDescription: p.longDescription || p.description || "",
          longDescriptionEn:
            p.longDescriptionEn || p.descriptionEn || p.description || "",
          sizes: p.sizes || sizeOptions.join(" · "),
          sizeOptions,
          images: p.images || [],
          swatches: p.swatches || [],
          inStock: p.inStock !== false && Number(p.priceNum) > 0,
          sortOrder: p.sortOrder ?? i,
        };
      });

  // Mark the newest ~28 items (end of list) as New for the «Новинки» collection.
  const newIds = new Set(
    products
      .filter((p) => p.priceNum > 0 && !/gift/i.test(p.id || "") && !/gift/i.test(p.name || ""))
      .slice(-28)
      .map((p) => p.id)
  );
  products = products.map((p) => ({
    ...p,
    isNew: newIds.has(p.id) || Boolean(p.isNew),
  }));

  const catCounts = {};
  for (const p of products) {
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
  }
  console.log(`Prepared ${products.length} products`, catCounts);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : false,
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await seedProducts(client, products);
    await refreshCategoryCovers(client, products);
    await client.query("COMMIT");
    console.log(`Imported ${products.length} products into Postgres.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }

  // Keep data/products.json in sync for future seeds / backups
  const slim = products.map((p) => ({
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    sizes: p.sizes,
    sizeOptions: p.sizeOptions,
    price: p.price,
    priceNum: p.priceNum,
    color: p.color,
    colorHex: p.colorHex,
    material: p.material,
    description: p.description,
    descriptionEn: p.descriptionEn,
    longDescription: p.longDescription,
    longDescriptionEn: p.longDescriptionEn,
    shortDescription: p.shortDescription,
    images: p.images,
    swatches: p.swatches,
    inStock: p.inStock,
    sku: p.sku,
    category: p.category,
    isNew: p.isNew,
    isSale: p.isSale,
  }));
  fs.mkdirSync(path.dirname(LEGACY_JSON), { recursive: true });
  fs.writeFileSync(LEGACY_JSON, JSON.stringify(slim, null, 2) + "\n");
  console.log(`Wrote backup → data/products.json (${slim.length})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
