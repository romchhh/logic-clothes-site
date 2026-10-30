-- Logic Clothes — initial Postgres schema

CREATE TABLE IF NOT EXISTS _migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sizes_display TEXT NOT NULL DEFAULT '',
  price_num NUMERIC(12, 2) NOT NULL,
  price_label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  short_description TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  made_to_order BOOLEAN NOT NULL DEFAULT FALSE,
  sku TEXT NOT NULL,
  category TEXT,
  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_size_options (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  size TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, size)
);

CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_swatches (
  id SERIAL PRIMARY KEY,
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  img TEXT NOT NULL,
  label TEXT NOT NULL,
  hex TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('new', 'processing', 'done', 'cancelled')),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  delivery_method TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  comment TEXT,
  locale TEXT NOT NULL DEFAULT 'uk',
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notified BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  size_label TEXT,
  length_opt TEXT,
  material_opt TEXT,
  color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price_num NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_new ON products(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_images_slug ON product_images(product_slug, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_swatches_slug ON product_swatches(product_slug, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
