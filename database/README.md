# Database (PostgreSQL)

Storefront, admin і checkout читають/пишуть **Postgres**, не JSON.

## Setup

1. Створи БД і додай `DATABASE_URL` у `.env.local` (див. `.env.example`).
2. Застосуй схему та (опційно) імпортуй старий JSON:

```bash
npm run db:setup   # migrate + seed from data/*.json
# або окремо:
npm run migrate
npm run db:seed
```

## Tables

- `products` — slug PK (як колишній `Product.id`); `color_group` для варіантів кольору
- `product_size_options`, `product_images`, `product_swatches`
- `product_look_items` — кураторський блок «Також у цьому луці»
- `site_settings` — API-ключі / інтеграції (Telegram, НП, URL)
- `orders`, `order_items`
- `_migrations` — версії схеми

Публічні фіди: `/feeds/google/{uk|en}.xml`, `/feeds/meta/{uk|en}.xml`.

Категорії зберігаються в таблиці `categories` і керуються з `/admin/categories`.
`products.category` = slug категорії (`kind = category`). Колекції `all` / `new` — системні.

## Scripts

| Command | Action |
|---------|--------|
| `npm run migrate` | Apply `database/schema.sql` |
| `npm run db:seed` | Import `data/products.json` + `data/orders.json` |
| `npm run db:setup` | migrate + seed |

`data/*.json` — лише для початкового seed / бекапу; runtime їх більше не використовує.
