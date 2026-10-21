-- Product admin v2: bilingual fields, EUR/discount, flags, model meta, media meta

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS long_description_en TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS price_eur NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS compare_at_price_num NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS color_hex TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS photo_size TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS model_params TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_sale BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill EN from UK where empty
UPDATE products SET name_en = name WHERE name_en = '' OR name_en IS NULL;
UPDATE products SET description_en = description WHERE description_en = '' OR description_en IS NULL;
UPDATE products SET long_description_en = long_description
  WHERE long_description_en = '' OR long_description_en IS NULL;

ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video')),
  ADD COLUMN IF NOT EXISTS width INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER;

CREATE INDEX IF NOT EXISTS idx_products_is_popular ON products (is_popular) WHERE is_popular = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_is_sale ON products (is_sale) WHERE is_sale = TRUE;
