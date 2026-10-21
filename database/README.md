# Database (PostgreSQL)

Storefront, admin і checkout читають/пишуть **Postgres**, не JSON.

## Setup

1. Створи БД і додай `DATABASE_URL` у `.env.local` (див. `.env.example`).
2. Застосуй схему та імпортуй дані:

```bash
# Свіжий сервер (migrate + catalog-dump або seed)
npm run db:init

# або старий шлях:
npm run db:setup   # migrate + seed from data/*.json
```

### Локальна БД → сервер

**Варіант A — напряму** (з ноутбука, якщо є доступ до Postgres на сервері):

```bash
# 1) на сервері один раз: схема
DATABASE_URL='postgresql://…server…' npm run migrate

# 2) локально: скопіювати каталог (товари + категорії)
TARGET_DATABASE_URL='postgresql://…server…' npm run db:push
```

**Варіант B — через файл** (scp):

```bash
# локально
npm run db:export
scp data/catalog-dump.json user@server:~/logic-clothes-site/data/

# на сервері
cd ~/logic-clothes-site
npm run db:init    # migrate + import dump
# або якщо схема вже є:
npm run db:import
```

`--with-settings` додає `site_settings` (ключі Telegram / НП) у dump / push.

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
| `npm run migrate` | Apply schema + migrations |
| `npm run db:export` | Dump catalog from DB → `data/catalog-dump.json` |
| `npm run db:import` | Replace catalog from dump |
| `npm run db:push` | Local DB → `TARGET_DATABASE_URL` |
| `npm run db:init` | migrate + import dump (або seed) |
| `npm run db:seed` | Import `data/products.json` + `data/orders.json` |
| `npm run db:setup` | migrate + seed |

`data/*.json` — лише для початкового seed / бекапу; runtime їх більше не використовує.
