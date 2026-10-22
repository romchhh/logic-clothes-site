-- Show / hide product in catalog listings (PDP remains reachable by direct URL)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_products_is_visible
  ON products (is_visible)
  WHERE is_visible = true;
