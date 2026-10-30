-- Product availability: in stock and/or sew in 14 days
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS made_to_order boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_made_to_order
  ON products (made_to_order)
  WHERE made_to_order = true;
