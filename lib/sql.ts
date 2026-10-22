import { revalidatePath, revalidateTag } from "next/cache";
import { normalizeSizeOptions } from "@/lib/catalogProduct";
import { getPool, query, withTransaction } from "@/lib/db";
import {
  resolveProductAssetUrl,
  resolveProductImages,
} from "@/lib/productImageResolve";
import type {
  CheckoutPayload,
  DeliveryMethod,
  Product,
  ProductMedia,
  ProductSwatch,
} from "@/lib/types";

export type StoredOrder = {
  id: string;
  createdAt: string;
  status: "new" | "processing" | "done" | "cancelled";
  customerName: string;
  phone: string;
  email?: string;
  deliveryMethod: DeliveryMethod;
  city: string;
  address: string;
  comment?: string;
  locale: string;
  items: CheckoutPayload["items"];
  total: number;
  notified?: boolean;
};

type ProductRow = {
  slug: string;
  name: string;
  name_en: string | null;
  sizes_display: string;
  price_num: string | number;
  price_label: string;
  price_eur: string | number | null;
  compare_at_price_num: string | number | null;
  color: string;
  color_hex: string | null;
  material: string;
  description: string;
  description_en: string | null;
  long_description: string;
  long_description_en: string | null;
  short_description: string | null;
  photo_size: string | null;
  model_params: string | null;
  in_stock: boolean;
  sku: string;
  category: string | null;
  is_new: boolean;
  is_popular: boolean;
  is_sale: boolean;
  sort_order: number;
  color_group: string | null;
  look_ids: string[] | null;
  size_options: string[] | null;
  length_options: string[] | null;
  material_options: string[] | null;
  media: Array<{
    url: string;
    media_type?: string;
    width?: number | null;
    height?: number | null;
  }> | null;
  swatches: Array<{ img: string; label: string; hex?: string | null }> | null;
};

function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mapProduct(row: ProductRow): Product {
  const sizeOptions = normalizeSizeOptions(
    Array.isArray(row.size_options) ? row.size_options.filter(Boolean) : []
  );

  const media: ProductMedia[] = Array.isArray(row.media)
    ? row.media
        .filter((m) => m?.url)
        .map((m) => ({
          url: m.url,
          type: m.media_type === "video" ? "video" : "image",
          ...(m.width != null ? { width: Number(m.width) } : {}),
          ...(m.height != null ? { height: Number(m.height) } : {}),
        }))
    : [];

  const slug = row.slug;
  const imageUrls = media
    .filter((m) => m.type === "image")
    .map((m) => resolveProductAssetUrl(m.url, slug));
  const images = resolveProductImages(
    imageUrls.length > 0 ? imageUrls : media.map((m) => m.url),
    slug
  );
  const mediaResolved: ProductMedia[] = media.map((m) => ({
    ...m,
    url: resolveProductAssetUrl(m.url, slug),
  }));
  const fallbackImg = images[0] || "";

  const swatches: ProductSwatch[] = Array.isArray(row.swatches)
    ? row.swatches.map((s) => ({
        img: resolveProductAssetUrl(
          s.img && !s.img.includes("undefined") ? s.img : fallbackImg,
          slug
        ),
        label: s.label,
        ...(s.hex ? { hex: s.hex } : {}),
      }))
    : [];

  const lookProductIds = Array.isArray(row.look_ids)
    ? row.look_ids.filter(Boolean)
    : [];

  const priceEur = row.price_eur != null ? num(row.price_eur) : null;
  const compareAt =
    row.compare_at_price_num != null ? num(row.compare_at_price_num) : null;

  return {
    id: row.slug,
    name: row.name,
    ...(row.name_en ? { nameEn: row.name_en } : {}),
    sizes: row.sizes_display || sizeOptions.join(" · "),
    sizeOptions,
    lengthOptions: Array.isArray(row.length_options)
      ? row.length_options.filter(Boolean)
      : [],
    materialOptions: Array.isArray(row.material_options)
      ? row.material_options.filter(Boolean)
      : [],
    price: row.price_label,
    priceNum: num(row.price_num),
    ...(priceEur != null && priceEur > 0 ? { priceEur } : {}),
    ...(compareAt != null && compareAt > 0 ? { compareAtPriceNum: compareAt } : {}),
    color: row.color || "",
    ...(row.color_hex ? { colorHex: row.color_hex } : {}),
    material: row.material || "",
    description: row.description || "",
    ...(row.description_en ? { descriptionEn: row.description_en } : {}),
    longDescription: row.long_description || "",
    ...(row.long_description_en
      ? { longDescriptionEn: row.long_description_en }
      : {}),
    ...(row.short_description
      ? { shortDescription: row.short_description }
      : {}),
    ...(row.photo_size ? { photoSize: row.photo_size } : {}),
    ...(row.model_params ? { modelParams: row.model_params } : {}),
    images,
    media: mediaResolved,
    swatches,
    inStock: Boolean(row.in_stock),
    sku: row.sku,
    ...(row.category ? { category: row.category } : {}),
    ...(row.is_new ? { isNew: true } : {}),
    ...(row.is_popular ? { isPopular: true } : {}),
    ...(row.is_sale ? { isSale: true } : {}),
    sortOrder: Number(row.sort_order) || 0,
    colorGroup: row.color_group || null,
    ...(lookProductIds.length ? { lookProductIds } : {}),
  };
}

const PRODUCT_SELECT = `
  SELECT
    p.slug,
    p.name,
    p.name_en,
    p.sizes_display,
    p.price_num,
    p.price_label,
    p.price_eur,
    p.compare_at_price_num,
    p.color,
    p.color_hex,
    p.material,
    p.description,
    p.description_en,
    p.long_description,
    p.long_description_en,
    p.short_description,
    p.photo_size,
    p.model_params,
    p.in_stock,
    p.sku,
    p.category,
    p.is_new,
    p.is_popular,
    p.is_sale,
    p.sort_order,
    p.color_group,
    COALESCE(
      (
        SELECT array_agg(l.related_slug ORDER BY l.sort_order, l.related_slug)
        FROM product_look_items l
        WHERE l.product_slug = p.slug
      ),
      '{}'::text[]
    ) AS look_ids,
    COALESCE(
      (
        SELECT array_agg(s.size ORDER BY s.sort_order, s.size)
        FROM product_size_options s
        WHERE s.product_slug = p.slug
      ),
      '{}'::text[]
    ) AS size_options,
    COALESCE(
      (
        SELECT array_agg(l.value ORDER BY l.sort_order, l.value)
        FROM product_length_options l
        WHERE l.product_slug = p.slug
      ),
      '{}'::text[]
    ) AS length_options,
    COALESCE(
      (
        SELECT array_agg(m.value ORDER BY m.sort_order, m.value)
        FROM product_material_options m
        WHERE m.product_slug = p.slug
      ),
      '{}'::text[]
    ) AS material_options,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'url', i.url,
            'media_type', i.media_type,
            'width', i.width,
            'height', i.height
          )
          ORDER BY i.sort_order, i.id
        )
        FROM product_images i
        WHERE i.product_slug = p.slug
      ),
      '[]'::json
    ) AS media,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'img', sw.img,
            'label', sw.label,
            'hex', sw.hex
          )
          ORDER BY sw.sort_order, sw.id
        )
        FROM product_swatches sw
        WHERE sw.product_slug = p.slug
      ),
      '[]'::json
    ) AS swatches
  FROM products p
`;

function bustProductCache() {
  try {
    revalidateTag("products");
    revalidatePath("/uk");
    revalidatePath("/en");
    revalidatePath("/uk/catalog");
    revalidatePath("/en/catalog");
    revalidatePath("/api/products");
  } catch {
    // ignore outside Next request context (scripts / migrate)
  }
}

export async function sqlGetAllProducts(): Promise<Product[]> {
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} ORDER BY p.sort_order ASC, p.created_at DESC, p.slug ASC`
  );
  return rows.map(mapProduct);
}

export async function sqlGetProduct(slug: string): Promise<Product | null> {
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} WHERE p.slug = $1 LIMIT 1`,
    [slug]
  );
  return rows[0] ? mapProduct(rows[0]) : null;
}

async function replaceProductChildren(
  client: import("pg").PoolClient,
  product: Product
) {
  await client.query(`DELETE FROM product_size_options WHERE product_slug = $1`, [
    product.id,
  ]);
  await client.query(
    `DELETE FROM product_length_options WHERE product_slug = $1`,
    [product.id]
  );
  await client.query(
    `DELETE FROM product_material_options WHERE product_slug = $1`,
    [product.id]
  );
  await client.query(`DELETE FROM product_images WHERE product_slug = $1`, [
    product.id,
  ]);
  await client.query(`DELETE FROM product_swatches WHERE product_slug = $1`, [
    product.id,
  ]);

  for (let i = 0; i < product.sizeOptions.length; i++) {
    await client.query(
      `INSERT INTO product_size_options (product_slug, size, sort_order)
       VALUES ($1, $2, $3)`,
      [product.id, product.sizeOptions[i], i]
    );
  }

  const lengthOptions = product.lengthOptions || [];
  for (let i = 0; i < lengthOptions.length; i++) {
    await client.query(
      `INSERT INTO product_length_options (product_slug, value, sort_order)
       VALUES ($1, $2, $3)`,
      [product.id, lengthOptions[i], i]
    );
  }

  const materialOptions = product.materialOptions || [];
  for (let i = 0; i < materialOptions.length; i++) {
    await client.query(
      `INSERT INTO product_material_options (product_slug, value, sort_order)
       VALUES ($1, $2, $3)`,
      [product.id, materialOptions[i], i]
    );
  }

  const mediaList: ProductMedia[] =
    product.media?.length
      ? product.media
      : product.images.map((url) => ({ url, type: "image" as const }));

  for (let i = 0; i < mediaList.length; i++) {
    const m = mediaList[i];
    await client.query(
      `INSERT INTO product_images (product_slug, url, sort_order, media_type, width, height)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        product.id,
        m.url,
        i,
        m.type === "video" ? "video" : "image",
        m.width ?? null,
        m.height ?? null,
      ]
    );
  }

  for (let i = 0; i < product.swatches.length; i++) {
    const sw = product.swatches[i];
    await client.query(
      `INSERT INTO product_swatches (product_slug, img, label, hex, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [product.id, sw.img, sw.label, sw.hex ?? null, i]
    );
  }
}

export async function sqlUpsertProduct(product: Product): Promise<Product> {
  await withTransaction(async (client) => {
    let sortOrder = product.sortOrder;
    if (sortOrder == null || !Number.isFinite(sortOrder)) {
      const existing = await client.query<{ sort_order: number }>(
        `SELECT sort_order FROM products WHERE slug = $1`,
        [product.id]
      );
      if (existing.rows[0]) {
        sortOrder = Number(existing.rows[0].sort_order) || 0;
      } else {
        const maxRow = await client.query<{ max: number | null }>(
          `SELECT MAX(sort_order) AS max FROM products`
        );
        sortOrder = (maxRow.rows[0]?.max ?? -1) + 1;
      }
    }

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
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        sizes_display = EXCLUDED.sizes_display,
        price_num = EXCLUDED.price_num,
        price_label = EXCLUDED.price_label,
        price_eur = EXCLUDED.price_eur,
        compare_at_price_num = EXCLUDED.compare_at_price_num,
        color = EXCLUDED.color,
        color_hex = EXCLUDED.color_hex,
        material = EXCLUDED.material,
        description = EXCLUDED.description,
        description_en = EXCLUDED.description_en,
        long_description = EXCLUDED.long_description,
        long_description_en = EXCLUDED.long_description_en,
        short_description = EXCLUDED.short_description,
        photo_size = EXCLUDED.photo_size,
        model_params = EXCLUDED.model_params,
        in_stock = EXCLUDED.in_stock,
        sku = EXCLUDED.sku,
        category = EXCLUDED.category,
        is_new = EXCLUDED.is_new,
        is_popular = EXCLUDED.is_popular,
        is_sale = EXCLUDED.is_sale,
        color_group = EXCLUDED.color_group,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
      `,
      [
        product.id,
        product.name,
        product.nameEn || "",
        product.sizes || product.sizeOptions.join(" · "),
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
        product.inStock,
        String(product.sku ?? product.id),
        product.category ?? null,
        Boolean(product.isNew),
        Boolean(product.isPopular),
        Boolean(product.isSale),
        product.colorGroup ?? null,
        sortOrder,
      ]
    );

    await replaceProductChildren(client, product);

    await client.query(
      `DELETE FROM product_look_items WHERE product_slug = $1`,
      [product.id]
    );
    const lookIds = product.lookProductIds ?? [];
    for (let i = 0; i < lookIds.length; i++) {
      const related = lookIds[i];
      if (!related || related === product.id) continue;
      await client.query(
        `INSERT INTO product_look_items (product_slug, related_slug, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [product.id, related, i]
      );
    }
  });

  bustProductCache();
  return product;
}

export async function sqlDeleteProduct(slug: string): Promise<boolean> {
  const result = await getPool().query(
    `DELETE FROM products WHERE slug = $1`,
    [slug]
  );
  const deleted = (result.rowCount ?? 0) > 0;
  if (deleted) bustProductCache();
  return deleted;
}

type OrderRow = {
  id: string;
  created_at: Date | string;
  status: StoredOrder["status"];
  customer_name: string;
  phone: string;
  email: string | null;
  delivery_method: DeliveryMethod;
  city: string;
  address: string;
  comment: string | null;
  locale: string;
  total: string | number;
  notified: boolean;
  items: CheckoutPayload["items"] | null;
};

function mapOrder(row: OrderRow): StoredOrder {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

  return {
    id: row.id,
    createdAt,
    status: row.status,
    customerName: row.customer_name,
    phone: row.phone,
    ...(row.email ? { email: row.email } : {}),
    deliveryMethod: row.delivery_method,
    city: row.city,
    address: row.address,
    ...(row.comment ? { comment: row.comment } : {}),
    locale: row.locale || "uk",
    items: Array.isArray(row.items) ? row.items : [],
    total: num(row.total),
    notified: Boolean(row.notified),
  };
}

const ORDER_SELECT = `
  SELECT
    o.id,
    o.created_at,
    o.status,
    o.customer_name,
    o.phone,
    o.email,
    o.delivery_method,
    o.city,
    o.address,
    o.comment,
    o.locale,
    o.total,
    o.notified,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'productId', oi.product_id,
            'name', oi.name,
            'size', oi.size,
            'sizeLabel', NULLIF(oi.size_label, ''),
            'length', NULLIF(oi.length_opt, ''),
            'material', NULLIF(oi.material_opt, ''),
            'color', NULLIF(oi.color, ''),
            'quantity', oi.quantity,
            'priceNum', oi.price_num,
            'image', (
              SELECT pi.url
              FROM product_images pi
              WHERE pi.product_slug = oi.product_id
              ORDER BY pi.sort_order ASC, pi.id ASC
              LIMIT 1
            )
          )
          ORDER BY oi.id
        )
        FROM order_items oi
        WHERE oi.order_id = o.id
      ),
      '[]'::json
    ) AS items
  FROM orders o
`;

export async function sqlGetAllOrders(): Promise<StoredOrder[]> {
  const rows = await query<OrderRow>(
    `${ORDER_SELECT} ORDER BY o.created_at DESC`
  );
  return rows.map(mapOrder);
}

export async function sqlGetOrder(id: string): Promise<StoredOrder | null> {
  const rows = await query<OrderRow>(
    `${ORDER_SELECT} WHERE o.id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] ? mapOrder(rows[0]) : null;
}

async function insertOrderItems(
  client: import("pg").PoolClient,
  orderId: string,
  items: CheckoutPayload["items"]
) {
  for (const item of items) {
    await client.query(
      `INSERT INTO order_items (
         order_id, product_id, name, size, quantity, price_num,
         size_label, length_opt, material_opt, color
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        orderId,
        item.productId,
        item.name,
        item.size,
        item.quantity,
        item.priceNum,
        item.sizeLabel || null,
        item.length || null,
        item.material || null,
        item.color || null,
      ]
    );
  }
}

export async function sqlAppendOrder(order: StoredOrder): Promise<StoredOrder> {
  await withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO orders (
        id, created_at, status, customer_name, phone, email,
        delivery_method, city, address, comment, locale, total, notified
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13
      )
      `,
      [
        order.id,
        order.createdAt,
        order.status,
        order.customerName,
        order.phone,
        order.email ?? null,
        order.deliveryMethod,
        order.city,
        order.address,
        order.comment ?? null,
        order.locale,
        order.total,
        Boolean(order.notified),
      ]
    );
    await insertOrderItems(client, order.id, order.items);
  });
  return order;
}

export async function sqlUpdateOrder(
  id: string,
  patch: Partial<StoredOrder>
): Promise<StoredOrder | null> {
  const current = await sqlGetOrder(id);
  if (!current) return null;

  const next: StoredOrder = {
    ...current,
    ...patch,
    id: current.id,
    items: patch.items ?? current.items,
  };

  await withTransaction(async (client) => {
    await client.query(
      `
      UPDATE orders SET
        status = $2,
        customer_name = $3,
        phone = $4,
        email = $5,
        delivery_method = $6,
        city = $7,
        address = $8,
        comment = $9,
        locale = $10,
        total = $11,
        notified = $12
      WHERE id = $1
      `,
      [
        id,
        next.status,
        next.customerName,
        next.phone,
        next.email ?? null,
        next.deliveryMethod,
        next.city,
        next.address,
        next.comment ?? null,
        next.locale,
        next.total,
        Boolean(next.notified),
      ]
    );

    if (patch.items) {
      await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id]);
      await insertOrderItems(client, id, next.items);
    }
  });

  return next;
}

export async function sqlDeleteOrder(id: string): Promise<boolean> {
  const result = await getPool().query(`DELETE FROM orders WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

/**
 * Link `slug` with `otherIds` into one color group (13pm-style).
 * Pass empty array to unlink this product from any group.
 */
export async function sqlSyncColorVariants(
  slug: string,
  otherIds: string[]
): Promise<string | null> {
  const siblings = [
    ...new Set(otherIds.map(String).filter((id) => id && id !== slug)),
  ];

  await withTransaction(async (client) => {
    const { rows: me } = await client.query<{ color_group: string | null }>(
      `SELECT color_group FROM products WHERE slug = $1`,
      [slug]
    );
    if (!me.length) throw new Error("Product not found");
    const oldGroup = me[0].color_group;

    if (siblings.length === 0) {
      await client.query(
        `UPDATE products SET color_group = NULL, updated_at = NOW() WHERE slug = $1`,
        [slug]
      );
      if (oldGroup) {
        const { rows: left } = await client.query<{ c: string }>(
          `SELECT COUNT(*)::text AS c FROM products WHERE color_group = $1`,
          [oldGroup]
        );
        if (Number(left[0]?.c || 0) <= 1) {
          await client.query(
            `UPDATE products SET color_group = NULL, updated_at = NOW()
             WHERE color_group = $1`,
            [oldGroup]
          );
        }
      }
      return;
    }

    const { rows: groupRows } = await client.query<{ color_group: string | null }>(
      `SELECT color_group FROM products
       WHERE slug = ANY($1::text[]) AND color_group IS NOT NULL
       LIMIT 1`,
      [[slug, ...siblings]]
    );
    const groupId =
      groupRows[0]?.color_group ||
      `cg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    if (oldGroup && oldGroup !== groupId) {
      const keep = new Set([slug, ...siblings]);
      const { rows: oldMembers } = await client.query<{ slug: string }>(
        `SELECT slug FROM products WHERE color_group = $1`,
        [oldGroup]
      );
      for (const row of oldMembers) {
        if (!keep.has(row.slug)) {
          await client.query(
            `UPDATE products SET color_group = NULL, updated_at = NOW() WHERE slug = $1`,
            [row.slug]
          );
        }
      }
    }

    await client.query(
      `UPDATE products SET color_group = $2, updated_at = NOW()
       WHERE slug = ANY($1::text[])`,
      [[slug, ...siblings], groupId]
    );
  });

  bustProductCache();

  const updated = await sqlGetProduct(slug);
  return updated?.colorGroup ?? null;
}

/** Deep-copy a product (new slug). Does not join color group / look. */
export async function sqlDuplicateProduct(
  sourceSlug: string
): Promise<Product | null> {
  const source = await sqlGetProduct(sourceSlug);
  if (!source) return null;

  const { slugifyId } = await import("@/lib/slug");
  let id = slugifyId(`${source.name}-copy`);
  const all = await sqlGetAllProducts();
  if (all.some((p) => p.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const copy: Product = {
    ...source,
    id,
    name: `${source.name} (копія)`,
    sku: id,
    colorGroup: null,
    colorVariants: undefined,
    lookProductIds: [],
    isNew: true,
    sortOrder: undefined,
  };

  await sqlUpsertProduct(copy);
  return sqlGetProduct(id);
}

/** Set catalog order from an ordered list of product slugs (1-based ranks). */
export async function sqlReorderProducts(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await query(
    `UPDATE products AS p SET
      sort_order = v.ord::integer - 1,
      updated_at = NOW()
     FROM (
       SELECT * FROM unnest($1::text[]) WITH ORDINALITY AS t(slug, ord)
     ) AS v
     WHERE p.slug = v.slug`,
    [ids]
  );
  bustProductCache();
}

export { slugifyId } from "@/lib/slug";

export function formatPriceLabel(priceNum: number): string {
  return `${priceNum.toLocaleString("uk-UA")} ₴`;
}
