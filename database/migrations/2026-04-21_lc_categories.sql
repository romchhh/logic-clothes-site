-- Categories as first-class catalog entities (Shopify-style)

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  image TEXT NOT NULL DEFAULT '',
  label_uk TEXT NOT NULL,
  label_en TEXT NOT NULL,
  cta_uk TEXT NOT NULL DEFAULT 'До категорії',
  cta_en TEXT NOT NULL DEFAULT 'Shop now',
  kind TEXT NOT NULL DEFAULT 'category'
    CHECK (kind IN ('collection', 'category')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_sort
  ON categories (sort_order ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_categories_visible
  ON categories (is_visible) WHERE is_visible = TRUE;

INSERT INTO categories (
  id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_system
) VALUES
  (
    'all',
    '/assets/products/peplum_1.jpg',
    'Бестселери',
    'Bestsellers',
    'До категорії',
    'Shop now',
    'collection',
    0,
    TRUE
  ),
  (
    'new',
    '/assets/products/meshdress_1.jpg',
    'Новинки',
    'New in',
    'До категорії',
    'Shop now',
    'collection',
    1,
    TRUE
  ),
  (
    'dresses',
    '/assets/products/mesh-dress_1.jpg',
    'Сукні',
    'Dresses',
    'До категорії',
    'Shop now',
    'category',
    2,
    FALSE
  ),
  (
    'bottoms',
    '/assets/products/mini-skirt_1.jpg',
    'Спідниці та штани',
    'Skirts & trousers',
    'До категорії',
    'Shop now',
    'category',
    3,
    FALSE
  ),
  (
    'outerwear',
    '/assets/products/jacket_1.jpg',
    'Верхній одяг',
    'Outerwear',
    'До категорії',
    'Shop now',
    'category',
    4,
    FALSE
  ),
  (
    'tops',
    '/assets/products/duncancupra_1.jpg',
    'Топи та сорочки',
    'Tops & shirts',
    'До категорії',
    'Shop now',
    'category',
    5,
    FALSE
  ),
  (
    'accessories',
    '/assets/products/scarf_1.jpg',
    'Аксесуари',
    'Accessories',
    'До категорії',
    'Shop now',
    'category',
    6,
    FALSE
  )
ON CONFLICT (id) DO NOTHING;
