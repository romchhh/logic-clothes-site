-- Replace leftover perfume categories with Logic Clothes apparel taxonomy.
-- Product rows already use: dresses, bottoms, outerwear, tops, accessories.

DELETE FROM categories
WHERE id IN ('perfumes', 'home', 'body', 'sale')
  AND is_system = FALSE;

INSERT INTO categories (
  id, image, label_uk, label_en, cta_uk, cta_en, kind, sort_order, is_visible, is_system
) VALUES
  (
    'all',
    '/assets/products/meshdress-2_255_1.jpg',
    'Усі товари',
    'All',
    'Дивитись усі',
    'Shop all',
    'collection',
    0,
    TRUE,
    TRUE
  ),
  (
    'new',
    '/assets/products/coat_257_1.jpg',
    'Новинки',
    'New in',
    'Дивитись новинки',
    'Shop new',
    'collection',
    1,
    TRUE,
    TRUE
  ),
  (
    'dresses',
    '/assets/products/slip-dress-black_247_1.jpg',
    'Сукні',
    'Dresses',
    'До категорії',
    'Shop now',
    'category',
    2,
    TRUE,
    FALSE
  ),
  (
    'bottoms',
    '/assets/products/jeans-style-culottes_260_1.jpg',
    'Спідниці та штани',
    'Skirts & trousers',
    'До категорії',
    'Shop now',
    'category',
    3,
    TRUE,
    FALSE
  ),
  (
    'outerwear',
    '/assets/products/trench-eco_242_1.jpg',
    'Верхній одяг',
    'Outerwear',
    'До категорії',
    'Shop now',
    'category',
    4,
    TRUE,
    FALSE
  ),
  (
    'tops',
    '/assets/products/bratop_241_1.jpg',
    'Топи та сорочки',
    'Tops & shirts',
    'До категорії',
    'Shop now',
    'category',
    5,
    TRUE,
    FALSE
  ),
  (
    'accessories',
    '/assets/products/peplum-2_245_1.jpg',
    'Аксесуари',
    'Accessories',
    'До категорії',
    'Shop now',
    'category',
    6,
    TRUE,
    FALSE
  )
ON CONFLICT (id) DO UPDATE SET
  image = EXCLUDED.image,
  label_uk = EXCLUDED.label_uk,
  label_en = EXCLUDED.label_en,
  cta_uk = EXCLUDED.cta_uk,
  cta_en = EXCLUDED.cta_en,
  kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order,
  is_visible = EXCLUDED.is_visible,
  updated_at = NOW();

-- Flag recent catalog items as New (highest sort_order ≈ latest scrape).
UPDATE products SET is_new = FALSE;

UPDATE products SET is_new = TRUE
WHERE slug IN (
  SELECT slug FROM products
  WHERE price_num > 0 AND slug NOT ILIKE '%gift%'
  ORDER BY sort_order DESC
  LIMIT 28
);
