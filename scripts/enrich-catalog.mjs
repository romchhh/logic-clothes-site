#!/usr/bin/env node
/**
 * Enrich catalog: palette colors (from photo), bilingual copy,
 * length/material options, color groups, look links.
 *
 * npm run db:enrich  (or: node scripts/enrich-catalog.mjs)
 */
import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

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

const COLOR_PALETTE = [
  { id: "black", label: "Чорний", labelEn: "Black", hex: "#111111" },
  { id: "white", label: "Білий", labelEn: "White", hex: "#F5F5F5" },
  { id: "ivory", label: "Слонова кістка", labelEn: "Ivory", hex: "#F2EDE4" },
  { id: "beige", label: "Беж", labelEn: "Beige", hex: "#D4C4A8" },
  { id: "cream", label: "Кремовий", labelEn: "Cream", hex: "#E8DCC8" },
  { id: "sand", label: "Пісок", labelEn: "Sand", hex: "#C2A878" },
  { id: "camel", label: "Кемел", labelEn: "Camel", hex: "#A67B5B" },
  { id: "brown", label: "Коричневий", labelEn: "Brown", hex: "#5C4033" },
  { id: "chocolate", label: "Шоколад", labelEn: "Chocolate", hex: "#3D2314" },
  { id: "grey", label: "Сірий", labelEn: "Grey", hex: "#8A8A8A" },
  { id: "graphite", label: "Графіт", labelEn: "Graphite", hex: "#4A4A4A" },
  { id: "silver", label: "Срібло", labelEn: "Silver", hex: "#C0C0C0" },
  { id: "red", label: "Червоний", labelEn: "Red", hex: "#B91C1C" },
  { id: "burgundy", label: "Бордо", labelEn: "Burgundy", hex: "#6B1E2A" },
  { id: "pink", label: "Рожевий", labelEn: "Pink", hex: "#E8A0BF" },
  { id: "powder", label: "Пудра", labelEn: "Powder", hex: "#F2C4C4" },
  { id: "coral", label: "Корал", labelEn: "Coral", hex: "#E07A5F" },
  { id: "orange", label: "Помаранчевий", labelEn: "Orange", hex: "#E07B39" },
  { id: "mustard", label: "Гірчичний", labelEn: "Mustard", hex: "#C4A035" },
  { id: "olive", label: "Оливковий", labelEn: "Olive", hex: "#6B7F3B" },
  { id: "khaki", label: "Хакі", labelEn: "Khaki", hex: "#8A7E5A" },
  { id: "green", label: "Зелений", labelEn: "Green", hex: "#2F6B4F" },
  { id: "mint", label: "Мʼятний", labelEn: "Mint", hex: "#B7E1DF" },
  { id: "blue", label: "Блакитний", labelEn: "Sky", hex: "#7EB6D9" },
  { id: "navy-blue", label: "Синій", labelEn: "Blue", hex: "#1E3A5F" },
  { id: "navy", label: "Navy", labelEn: "Navy", hex: "#0F1C2E" },
  { id: "purple", label: "Фіолетовий", labelEn: "Purple", hex: "#5B3A6E" },
  { id: "lavender", label: "Лаванда", labelEn: "Lavender", hex: "#C5B4D6" },
  { id: "gold", label: "Золото", labelEn: "Gold", hex: "#C9A227" },
  { id: "multi", label: "Мульти", labelEn: "Multi", hex: "#FFFFFF" },
];

const SLUG_COLOR = [
  [/black|чорн|noir/i, "black"],
  [/white|біл|ivory|cream|крем/i, "white"],
  [/pink|рожев|фукс|fuchsia|blush/i, "pink"],
  [/lavender|лаванд|lilac|лілов/i, "lavender"],
  [/purple|violet|фіолет|чорнич/i, "purple"],
  [/red|червон|bordo|бордо|burgundy/i, "burgundy"],
  [/beige|беж|camel|кемел|sand|пісок/i, "beige"],
  [/brown|коричн|chocolate|шоколад/i, "brown"],
  [/grey|gray|сір|graphite|графіт/i, "grey"],
  [/green|зелен|olive|олив|mint|мʼят|мят/i, "olive"],
  [/blue|син|navy|блакит/i, "navy-blue"],
  [/yellow|жовт|mustard|гірчич/i, "mustard"],
  [/orange|помаранч|coral|корал/i, "coral"],
  [/gold|золот/i, "gold"],
  [/silver|сріб/i, "silver"],
  [/print|snake|leopard|multi|принт|plakhta/i, "multi"],
];

const LOOK_MAP = {
  dresses: ["outerwear", "tops", "accessories"],
  tops: ["bottoms", "outerwear", "accessories"],
  bottoms: ["tops", "outerwear", "accessories"],
  outerwear: ["dresses", "tops", "bottoms"],
  accessories: ["dresses", "tops", "outerwear"],
};

function normalizeHex(hex) {
  if (!hex) return null;
  let h = String(hex).trim().replace(/^#/, "").toUpperCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9A-F]{6}$/.test(h)) return null;
  return `#${h}`;
}

function hexDist(a, b) {
  const pa = a.slice(1);
  const pb = b.slice(1);
  const dr = parseInt(pa.slice(0, 2), 16) - parseInt(pb.slice(0, 2), 16);
  const dg = parseInt(pa.slice(2, 4), 16) - parseInt(pb.slice(2, 4), 16);
  const db = parseInt(pa.slice(4, 6), 16) - parseInt(pb.slice(4, 6), 16);
  return dr * dr + dg * dg + db * db;
}

function hexToRgb(hex) {
  const h = normalizeHex(hex);
  if (!h) return null;
  return {
    r: parseInt(h.slice(1, 3), 16),
    g: parseInt(h.slice(3, 5), 16),
    b: parseInt(h.slice(5, 7), 16),
  };
}

function nearestPalette(hex, hints = {}) {
  const h = normalizeHex(hex);
  if (!h) return null;
  const rgb = hexToRgb(h);
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const lum = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

  // Dark / near-neutral garments → black / graphite (avoid purple cast from photos)
  if (lum < 55 && sat < 0.22) {
    return paletteById(lum < 32 ? "black" : "graphite");
  }
  // Very light neutrals
  if (lum > 220 && sat < 0.12) {
    return paletteById(lum > 240 ? "white" : "ivory");
  }
  // Eco-leather without a clear bright hue → black (brand default)
  if (hints.leather && lum < 120 && sat < 0.45) {
    return paletteById(lum < 40 ? "black" : "graphite");
  }

  let best = null;
  let bestD = Infinity;
  for (const c of COLOR_PALETTE) {
    if (c.id === "multi") continue;
    const d = hexDist(h, c.hex);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function paletteById(id) {
  return COLOR_PALETTE.find((c) => c.id === id) || null;
}

async function sampleImageColor(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/assets/")) return null;
  const file = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  if (!fs.existsSync(file)) return null;
  try {
    const size = 64;
    const { data, info } = await sharp(file)
      .resize(size, size, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Weighted average: prefer center + more saturated pixels (garment, not studio grey)
    let r = 0,
      g = 0,
      b = 0,
      wSum = 0;
    const cx = (size - 1) / 2;
    const cy = (size - 1) / 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * info.channels;
        const rr = data[i];
        const gg = data[i + 1];
        const bb = data[i + 2];
        const max = Math.max(rr, gg, bb);
        const min = Math.min(rr, gg, bb);
        if (min > 242) continue; // white bg
        if (max < 12) continue; // voids
        const sat = max === 0 ? 0 : (max - min) / max;
        const dx = (x - cx) / cx;
        const dy = (y - cy) / cy;
        const center = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
        // Down-weight flat greys (studio floor / walls)
        const isGrey = sat < 0.08 && max > 40 && max < 210;
        let w = 0.35 + center * 1.4 + sat * 2.2;
        if (isGrey) w *= 0.15;
        if (sat > 0.18) w *= 1.6;
        r += rr * w;
        g += gg * w;
        b += bb * w;
        wSum += w;
      }
    }
    if (wSum < 1) return null;
    const toHex = (v) =>
      Math.round(v / wSum)
        .toString(16)
        .padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  } catch {
    return null;
  }
}

function colorFromSlug(slug, name) {
  const hay = `${slug} ${name}`;
  for (const [re, id] of SLUG_COLOR) {
    if (re.test(hay)) return id;
  }
  return null;
}

function cleanEnglish(raw) {
  if (!raw) return "";
  let t = String(raw)
    .replace(/\s+/g, " ")
    .replace(/Available for order[^.]*\.?/gi, "")
    .replace(/We can sew it in more than \d+ different colors\.?/gi, "")
    .replace(/Hight waist/gi, "High waist")
    .replace(/Composition\s*:\s*/gi, "")
    .trim();
  // Drop trailing composition fragments that repeat material
  t = t.replace(/\.\s*$/, "").trim();
  return t;
}

function extractMaterial(text, existing) {
  if (existing && existing.trim()) return existing.trim();
  const m = String(text || "").match(
    /(?:composition|fabric|склад)\s*[:：]?\s*([^.;]+)/i
  );
  if (m) return m[1].trim();
  if (/eco\s*leather|vegan\s*leather|faux\s*leather|екошкір/i.test(text)) {
    return "екошкіра";
  }
  if (/silk|шовк/i.test(text)) return "шовк";
  if (/cotton|бавовн/i.test(text)) return "бавовна";
  if (/linen|льон/i.test(text)) return "льон";
  if (/wool|вовн/i.test(text)) return "вовна";
  if (/mesh|сітк/i.test(text)) return "сітка";
  if (/denim|денім|джин/i.test(text)) return "денім";
  return "";
}

function inferLengthOptions(p) {
  const hay = `${p.slug} ${p.name} ${p.description || ""}`.toLowerCase();
  const opts = [];
  if (/\bmini\b|міні/.test(hay)) opts.push("Mini");
  if (/\bmidi\b|міді/.test(hay)) opts.push("Midi");
  if (/\bmaxi\b|максі/.test(hay)) opts.push("Maxi");
  if (/\bcrop\b|кроп/.test(hay)) opts.push("Crop");
  if (/\blong\b|довг/.test(hay) && p.category === "outerwear") opts.push("Long");

  if (opts.length) return [...new Set(opts)];

  // Sensible category defaults (single option = shown as chosen variation)
  if (p.category === "dresses") return ["Midi"];
  if (p.category === "bottoms" && /skirt|спідниц/i.test(hay)) return ["Midi"];
  if (p.category === "bottoms") return ["Midi"];
  if (p.category === "outerwear") return ["Long"];
  if (p.category === "tops" && /crop/i.test(hay)) return ["Crop"];
  return [];
}

function inferMaterialOptions(p, materialText) {
  const hay = `${materialText} ${p.description || ""} ${p.name}`.toLowerCase();
  const opts = [];
  if (/eco|vegan|faux|екошкір|шкір/.test(hay)) opts.push("Екошкіра");
  if (/silk|шовк|cupra|купа/.test(hay)) opts.push("Шовк");
  if (/cotton|бавовн/.test(hay)) opts.push("Бавовна");
  if (/linen|льон/.test(hay)) opts.push("Льон");
  if (/wool|вовн|кашемір|cashmere/.test(hay)) opts.push("Вовна");
  if (/knit|трикотаж|jersey/.test(hay)) opts.push("Трикотаж");
  if (/viscose|віскоз/.test(hay)) opts.push("Віскоза");
  if (/denim|денім|джин/.test(hay)) opts.push("Денім");
  if (/mesh|сітк/.test(hay)) opts.push("Сітка");
  if (/polyester|поліестер/.test(hay) && !opts.length) opts.push("Поліестер");
  return [...new Set(opts)].slice(0, 3);
}

function ukCategoryNoun(category) {
  switch (category) {
    case "dresses":
      return "Сукня";
    case "tops":
      return "Топ";
    case "bottoms":
      return "Низ";
    case "outerwear":
      return "Верхній одяг";
    case "accessories":
      return "Аксесуар";
    default:
      return "Виріб";
  }
}

function localizeMaterial(material) {
  const m = String(material || "").trim();
  if (!m) return "";
  return m
    .replace(/faux leather[^,]*/gi, "екошкіра")
    .replace(/eco\s*\(?vegan\)?\s*leather/gi, "екошкіра")
    .replace(/vegan leather/gi, "екошкіра")
    .replace(/polyester/gi, "поліестер")
    .replace(/elastane/gi, "еластан")
    .replace(/cotton/gi, "бавовна")
    .replace(/viscose/gi, "віскоза")
    .replace(/silk/gi, "шовк")
    .replace(/wool/gi, "вовна")
    .replace(/linen/gi, "льон");
}

function looksUkrainian(text) {
  return /[іїєґІЇЄҐ]/.test(text || "") || /Logic Clothes — український|від Logic Clothes/.test(text || "");
}

function englishSource(p) {
  const candidates = [
    p.description_en,
    p.long_description_en,
    p.description,
    p.long_description,
  ];
  for (const c of candidates) {
    if (!c || !String(c).trim()) continue;
    if (looksUkrainian(c)) continue;
    return String(c);
  }
  // last resort: any non-empty
  return candidates.find((c) => c && String(c).trim()) || "";
}

function categoryBlurb(category, lang) {
  const uk = {
    dresses: "Сукня з чистим силуетом — тримає форму й зручно сідає по фігурі.",
    tops: "Верх, який легко комбінувати: самостійно або в шаруванні.",
    bottoms: "Низ з продуманою посадкою — для щодня й особливих виходів.",
    outerwear: "Верхній одяг для міста: тепло, рух і характерний крій.",
    accessories: "Аксесуар, що збирає образ докупи.",
  };
  const en = {
    dresses: "A clean-silhouette dress that holds its shape and flatters the body.",
    tops: "A versatile top — wear alone or layered.",
    bottoms: "Bottoms with considered fit — for everyday and evenings out.",
    outerwear: "City outerwear: warmth, movement, and a distinctive cut.",
    accessories: "An accessory that completes the look.",
  };
  return (lang === "en" ? en : uk)[category] || (lang === "en"
    ? "Designed in Kyiv, sewn to your measurements."
    : "Дизайн у Києві, пошиття під ваші мірки.");
}

function polishCopy(p, palette, material) {
  let enBase = cleanEnglish(englishSource(p))
    .replace(/\s+Composition.+$/i, "")
    .trim();
  if (looksUkrainian(enBase)) enBase = "";

  const colorEn = palette?.labelEn || "";
  const colorUk = palette?.label || "";
  const materialUk = localizeMaterial(material);
  const noun = ukCategoryNoun(p.category);
  const fabricHint = /leather|екошкір|vegan|faux/i.test(`${enBase} ${material}`);
  const meshHint = /mesh|сітк/i.test(`${p.name} ${p.id} ${enBase}`);

  const enParts = [
    `${p.name} by Logic Clothes.`,
    enBase || categoryBlurb(p.category, "en"),
  ];
  if (fabricHint) enParts.push("Soft vegan leather with a comfortable lining.");
  if (meshHint) enParts.push("Sheer mesh — made for layering.");
  if (colorEn) enParts.push(`Palette colour: ${colorEn}.`);
  if (material) enParts.push(`Composition: ${material}.`);
  enParts.push(
    "Made to order in Kyiv — other palette colours and custom measurements on request."
  );
  const descriptionEn = enParts.join(" ").replace(/\s+/g, " ").trim();

  const ukBits = [
    `${noun} ${p.name} від Logic Clothes.`,
    categoryBlurb(p.category, "uk"),
  ];
  if (fabricHint) ukBits.push("М’яка екошкіра з комфортною підкладкою.");
  if (meshHint) ukBits.push("Напівпрозора сітка — ідеально для шарування.");
  if (colorUk) ukBits.push(`Колір палітри: ${colorUk}.`);
  if (materialUk) ukBits.push(`Склад: ${materialUk}.`);
  ukBits.push(
    "Немає вашого кольору в наявності? Зшиємо з палітри — напишіть нам."
  );
  const descriptionUk = ukBits.join(" ");

  return { descriptionUk, descriptionEn, materialUk };
}

/** Model stem from slug — slip-dress-black → slip-dress, coat-2 → coat */
function modelStem(slug) {
  let s = String(slug || "").toLowerCase();
  // strip trailing colour / index tokens repeatedly
  for (let i = 0; i < 4; i++) {
    const next = s
      .replace(
        /-(black|white|pink|red|blue|green|grey|gray|beige|brown|navy|ivory|cream|lilac|lavender|fuchsia|yellow|orange|gold|silver|mint|olive|bordo|burgundy|eco)$/g,
        ""
      )
      .replace(/-\d+$/g, "")
      .replace(/(black|white|pink|red|navy)$/g, "");
    if (next === s) break;
    s = next;
  }
  return s.replace(/-+$/g, "");
}

function baseNameKey(p) {
  const stem = modelStem(p.id);
  // Generic one-word names ("dress", "skirt", "top") alone are too broad —
  // require a non-trivial stem (≥2 meaningful tokens or longer slug).
  const tokens = stem.split("-").filter(Boolean);
  const generic = new Set([
    "dress",
    "skirt",
    "top",
    "coat",
    "jacket",
    "trousers",
    "shirt",
    "bag",
    "product",
  ]);
  if (tokens.length === 1 && generic.has(tokens[0])) {
    // Too generic alone ("dress", "skirt") — don't auto-group by this key
    return null;
  }
  return `${p.category}::stem::${stem}`;
}

function slugifyGroup(key) {
  return (
    "cg_" +
    key
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 56)
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const { rows: products } = await pool.query(`
    SELECT
      p.slug AS id,
      p.name,
      p.name_en,
      p.category,
      p.color,
      p.color_hex,
      p.material,
      p.description,
      p.description_en,
      p.long_description,
      p.long_description_en,
      p.price_num,
      p.in_stock,
      (
        SELECT i.url FROM product_images i
        WHERE i.product_slug = p.slug
        ORDER BY i.sort_order ASC
        LIMIT 1
      ) AS image
    FROM products p
    WHERE p.price_num > 0
    ORDER BY p.sort_order ASC, p.slug ASC
  `);

  console.log(`Enriching ${products.length} products…`);

  const enriched = [];
  let nFromImage = 0;
  let nFromSlug = 0;
  let nKept = 0;

  for (const p of products) {
    let palette = null;

    // 1) slug / name hints first (most reliable for known variants)
    {
      const id = colorFromSlug(p.id, p.name);
      if (id) {
        palette = paletteById(id);
        nFromSlug++;
      }
    }

    const leatherHint = /leather|екошкір|vegan|faux|еко.?шкір/i.test(
      `${p.material || ""} ${p.description || ""} ${p.name || ""} ${p.id}`
    );

    // 2) always re-sample photo (center + saturation) unless slug already decided
    if (!palette && p.image) {
      const sampled = await sampleImageColor(p.image);
      if (sampled) {
        palette = nearestPalette(sampled, { leather: leatherHint });
        if (palette) nFromImage++;
      }
    }

    // 3) soft defaults by category
    if (!palette) {
      const defaults = {
        dresses: "black",
        tops: "black",
        bottoms: "black",
        outerwear: "black",
        accessories: "black",
      };
      palette = paletteById(defaults[p.category] || "black");
      nKept++;
    }

    const materialRaw = extractMaterial(
      `${p.description || ""} ${p.long_description || ""}`,
      p.material
    );
    const { descriptionUk, descriptionEn, materialUk } = polishCopy(
      p,
      palette,
      materialRaw
    );
    const material = materialUk || materialRaw;
    const lengthOptions = inferLengthOptions(p);
    const materialOptions = inferMaterialOptions(p, materialRaw);

    enriched.push({
      ...p,
      palette,
      material,
      descriptionUk,
      descriptionEn,
      lengthOptions,
      materialOptions,
      baseKey: baseNameKey(p),
    });
  }

  // Color groups: same model stem within category, 2+ SKUs
  const byBase = new Map();
  for (const e of enriched) {
    if (!e.baseKey) continue;
    const list = byBase.get(e.baseKey) || [];
    list.push(e);
    byBase.set(e.baseKey, list);
  }
  const groupOf = new Map();
  let groups = 0;
  for (const [key, list] of byBase) {
    if (list.length < 2) continue;
    // Cap huge accidental groups
    if (list.length > 14) continue;
    const groupId = slugifyGroup(key);
    groups++;
    for (const e of list) groupOf.set(e.id, groupId);
  }

  // Look links
  const byCat = new Map();
  for (const e of enriched) {
    const c = e.category || "other";
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(e);
  }

  function pickLook(e) {
    const targets = LOOK_MAP[e.category] || ["dresses", "tops"];
    const picks = [];
    const used = new Set([e.id]);

    // same palette first
    for (const cat of targets) {
      const poolItems = (byCat.get(cat) || []).filter(
        (x) =>
          !used.has(x.id) &&
          x.palette?.id &&
          e.palette?.id &&
          x.palette.id === e.palette.id
      );
      for (const x of poolItems) {
        if (picks.length >= 4) break;
        picks.push(x.id);
        used.add(x.id);
      }
      if (picks.length >= 4) break;
    }

    // fill with any from related cats
    for (const cat of targets) {
      if (picks.length >= 4) break;
      for (const x of byCat.get(cat) || []) {
        if (used.has(x.id)) continue;
        picks.push(x.id);
        used.add(x.id);
        if (picks.length >= 4) break;
      }
    }
    return picks;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const e of enriched) {
      const hex = e.palette.hex;
      const label = e.palette.label;
      await client.query(
        `UPDATE products SET
           color = $2,
           color_hex = $3,
           material = $4,
           description = $5,
           description_en = $6,
           long_description = $5,
           long_description_en = $6,
           color_group = $7,
           updated_at = NOW()
         WHERE slug = $1`,
        [
          e.id,
          label,
          hex,
          e.material || "",
          e.descriptionUk,
          e.descriptionEn,
          groupOf.get(e.id) || null,
        ]
      );

      // swatch sync (single brand swatch)
      await client.query(
        `DELETE FROM product_swatches WHERE product_slug = $1`,
        [e.id]
      );
      await client.query(
        `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
         VALUES ($1, $2, $3, $4, 0)`,
        [e.id, e.image || "", label, hex]
      );

      await client.query(
        `DELETE FROM product_length_options WHERE product_slug = $1`,
        [e.id]
      );
      for (let i = 0; i < e.lengthOptions.length; i++) {
        await client.query(
          `INSERT INTO product_length_options (product_slug, value, sort_order)
           VALUES ($1, $2, $3)`,
          [e.id, e.lengthOptions[i], i]
        );
      }

      await client.query(
        `DELETE FROM product_material_options WHERE product_slug = $1`,
        [e.id]
      );
      for (let i = 0; i < e.materialOptions.length; i++) {
        await client.query(
          `INSERT INTO product_material_options (product_slug, value, sort_order)
           VALUES ($1, $2, $3)`,
          [e.id, e.materialOptions[i], i]
        );
      }

      const look = pickLook(e);
      await client.query(
        `DELETE FROM product_look_items WHERE product_slug = $1`,
        [e.id]
      );
      for (let i = 0; i < look.length; i++) {
        await client.query(
          `INSERT INTO product_look_items (product_slug, related_slug, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [e.id, look[i], i]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  // Backup slim JSON for seeds
  const { rows: dump } = await pool.query(`
    SELECT
      p.slug AS id,
      p.name,
      p.name_en AS "nameEn",
      p.sizes_display AS sizes,
      p.price_label AS price,
      p.price_num AS "priceNum",
      p.color,
      p.color_hex AS "colorHex",
      p.material,
      p.description,
      p.description_en AS "descriptionEn",
      p.long_description AS "longDescription",
      p.long_description_en AS "longDescriptionEn",
      p.in_stock AS "inStock",
      p.sku,
      p.category,
      p.is_new AS "isNew",
      p.is_sale AS "isSale",
      p.color_group AS "colorGroup",
      COALESCE((
        SELECT array_agg(s.size ORDER BY s.sort_order)
        FROM product_size_options s WHERE s.product_slug = p.slug
      ), '{}') AS "sizeOptions",
      COALESCE((
        SELECT array_agg(l.value ORDER BY l.sort_order)
        FROM product_length_options l WHERE l.product_slug = p.slug
      ), '{}') AS "lengthOptions",
      COALESCE((
        SELECT array_agg(m.value ORDER BY m.sort_order)
        FROM product_material_options m WHERE m.product_slug = p.slug
      ), '{}') AS "materialOptions",
      COALESCE((
        SELECT array_agg(i.url ORDER BY i.sort_order)
        FROM product_images i WHERE i.product_slug = p.slug
      ), '{}') AS images
    FROM products p
    ORDER BY p.sort_order, p.slug
  `);

  const out = path.join(process.cwd(), "data", "products.json");
  fs.writeFileSync(out, JSON.stringify(dump, null, 2) + "\n");

  const withGroup = [...groupOf.keys()].length;
  console.log(
    JSON.stringify(
      {
        products: enriched.length,
        colorFromImage: nFromImage,
        colorFromSlug: nFromSlug,
        colorKept: nKept,
        colorGroups: groups,
        productsInGroups: withGroup,
        backup: out,
      },
      null,
      2
    )
  );

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
