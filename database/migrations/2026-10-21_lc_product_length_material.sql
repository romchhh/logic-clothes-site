-- Optional length / material variations (chip options on PDP).

CREATE TABLE IF NOT EXISTS product_length_options (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, value)
);

CREATE TABLE IF NOT EXISTS product_material_options (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, value)
);

CREATE INDEX IF NOT EXISTS idx_product_length_options_slug
  ON product_length_options (product_slug, sort_order);

CREATE INDEX IF NOT EXISTS idx_product_material_options_slug
  ON product_material_options (product_slug, sort_order);
