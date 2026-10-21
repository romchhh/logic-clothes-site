import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { query } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";
import { slugFromLabels, slugifyId } from "@/lib/slug";

export type CategoryKind = "collection" | "category";

/** Dynamic slug from DB (includes system collections `all` / `new`). */
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  image: string;
  label: Record<Locale, string>;
  cta: Record<Locale, string>;
  kind: CategoryKind;
  sortOrder: number;
  isVisible: boolean;
  isSystem: boolean;
  productCount?: number;
}

type CategoryRow = {
  id: string;
  image: string;
  label_uk: string;
  label_en: string;
  cta_uk: string;
  cta_en: string;
  kind: CategoryKind;
  sort_order: number;
  is_visible: boolean;
  is_system: boolean;
  product_count?: string | number | null;
};

function mapCategory(row: CategoryRow): Category {
  const count =
    row.product_count == null ? undefined : Number(row.product_count);
  return {
    id: row.id,
    image: row.image || "",
    label: { uk: row.label_uk, en: row.label_en },
    cta: { uk: row.cta_uk, en: row.cta_en },
    kind: row.kind,
    sortOrder: row.sort_order,
    isVisible: Boolean(row.is_visible),
    isSystem: Boolean(row.is_system),
    ...(typeof count === "number" && Number.isFinite(count)
      ? { productCount: count }
      : {}),
  };
}

const SELECT_BASE = `
  SELECT
    c.id,
    c.image,
    c.label_uk,
    c.label_en,
    c.cta_uk,
    c.cta_en,
    c.kind,
    c.sort_order,
    c.is_visible,
    c.is_system
`;

async function fetchCategoriesFromDb(opts?: {
  includeHidden?: boolean;
  withCounts?: boolean;
}): Promise<Category[]> {
  const includeHidden = opts?.includeHidden ?? false;
  const withCounts = opts?.withCounts ?? false;

  const where = includeHidden ? "" : "WHERE c.is_visible = TRUE";
  const countJoin = withCounts
    ? `LEFT JOIN products p ON p.category = c.id`
    : "";
  const countSelect = withCounts
    ? `, COUNT(p.slug)::int AS product_count`
    : "";
  const groupBy = withCounts
    ? `GROUP BY c.id, c.image, c.label_uk, c.label_en, c.cta_uk, c.cta_en,
         c.kind, c.sort_order, c.is_visible, c.is_system`
    : "";

  const rows = await query<CategoryRow>(
    `${SELECT_BASE}${countSelect}
     FROM categories c
     ${countJoin}
     ${where}
     ${groupBy}
     ORDER BY c.sort_order ASC, c.id ASC`
  );

  return rows.map(mapCategory);
}

/** Public storefront list (visible only), cached. */
export const getCategories = unstable_cache(
  async (): Promise<Category[]> => fetchCategoriesFromDb({ includeHidden: false }),
  ["logic-clothes-categories"],
  { revalidate: 300, tags: ["categories"] }
);

/** Admin list with hidden + product counts. */
export async function getAdminCategories(): Promise<Category[]> {
  return fetchCategoriesFromDb({ includeHidden: true, withCounts: true });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const rows = await query<CategoryRow>(
    `${SELECT_BASE}
     FROM categories c
     WHERE c.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] ? mapCategory(rows[0]) : null;
}

export type CategoryInput = {
  /** Optional — auto-generated from EN (or UK) label when omitted. */
  id?: string;
  image?: string;
  label: { uk: string; en: string };
  cta?: { uk: string; en: string };
  kind?: CategoryKind;
  sortOrder?: number;
  isVisible?: boolean;
};

async function uniqueCategoryId(base: string): Promise<string> {
  let id = base;
  let n = 2;
  while (true) {
    if (id === "all" || id === "new") {
      id = `${base}-${n}`;
      n += 1;
      continue;
    }
    const existing = await getCategoryById(id);
    if (!existing) return id;
    id = `${base}-${n}`;
    n += 1;
  }
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const raw =
    (input.id && input.id.trim()) ||
    slugFromLabels(input.label);
  const base = slugifyId(raw);
  if (!base) throw new Error("Invalid category id");

  const id = await uniqueCategoryId(base);

  let sortOrder = input.sortOrder;
  if (sortOrder == null) {
    const rows = await query<{ max: number | null }>(
      `SELECT MAX(sort_order) AS max FROM categories`
    );
    sortOrder = (rows[0]?.max ?? 0) + 1;
  }

  await query(
    `INSERT INTO categories (
      id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_visible, is_system
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE)`,
    [
      id,
      input.image ?? "",
      input.label.uk.trim(),
      input.label.en.trim(),
      input.cta?.uk?.trim() || "До категорії",
      input.cta?.en?.trim() || "Shop now",
      input.kind === "collection" ? "collection" : "category",
      sortOrder,
      input.isVisible !== false,
    ]
  );

  revalidateTag("categories");
  const created = await getCategoryById(id);
  if (!created) throw new Error("Failed to create category");
  return created;
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryInput> & { sortOrder?: number; isVisible?: boolean }
): Promise<Category> {
  const current = await getCategoryById(id);
  if (!current) throw new Error("Category not found");

  const image = patch.image ?? current.image;
  const labelUk = patch.label?.uk?.trim() ?? current.label.uk;
  const labelEn = patch.label?.en?.trim() ?? current.label.en;
  const ctaUk = patch.cta?.uk?.trim() ?? current.cta.uk;
  const ctaEn = patch.cta?.en?.trim() ?? current.cta.en;
  const sortOrder = patch.sortOrder ?? current.sortOrder;
  const isVisible =
    patch.isVisible !== undefined ? patch.isVisible : current.isVisible;

  // System collections keep kind; product categories stay as category.
  const kind = current.isSystem
    ? current.kind
    : patch.kind === "collection"
      ? "collection"
      : current.kind;

  await query(
    `UPDATE categories SET
      image = $2,
      label_uk = $3,
      label_en = $4,
      cta_uk = $5,
      cta_en = $6,
      kind = $7,
      sort_order = $8,
      is_visible = $9,
      updated_at = NOW()
     WHERE id = $1`,
    [id, image, labelUk, labelEn, ctaUk, ctaEn, kind, sortOrder, isVisible]
  );

  revalidateTag("categories");
  const updated = await getCategoryById(id);
  if (!updated) throw new Error("Failed to update category");
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const current = await getCategoryById(id);
  if (!current) throw new Error("Category not found");
  if (current.isSystem) {
    throw new Error("System categories cannot be deleted");
  }

  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products WHERE category = $1`,
    [id]
  );
  if (Number(rows[0]?.count || 0) > 0) {
    throw new Error("Category has products — reassign them first");
  }

  await query(`DELETE FROM categories WHERE id = $1`, [id]);
  revalidateTag("categories");
}

export async function reorderCategories(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await query(
    `UPDATE categories AS c SET
      sort_order = v.ord,
      updated_at = NOW()
     FROM (
       SELECT * FROM unnest($1::text[]) WITH ORDINALITY AS t(id, ord)
     ) AS v
     WHERE c.id = v.id`,
    [ids]
  );
  revalidateTag("categories");
}
