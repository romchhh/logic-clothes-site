-- Color variants (same model, different colors) + curated "also in this look"

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS color_group TEXT;

CREATE INDEX IF NOT EXISTS idx_products_color_group
  ON products (color_group)
  WHERE color_group IS NOT NULL;

CREATE TABLE IF NOT EXISTS product_look_items (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  related_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, related_slug),
  CHECK (product_slug <> related_slug)
);

CREATE INDEX IF NOT EXISTS idx_product_look_product
  ON product_look_items (product_slug, sort_order);
