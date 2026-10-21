# Logic Clothes

Інтернет-магазин українського бренду жіночого одягу на **Next.js 15 + React**.

Структура й патерни (App Router, `[lang]`, providers, client/server cache, API, SEO) — як у проєкті `chars`.

## Стек

- Next.js 15 (App Router, Turbopack)
- React 18 + TypeScript
- Локалізація `uk` / `en`
- Товари з `data/products.json` + `unstable_cache` + `/api/products`
- Кошик і вішлист у `localStorage`

## Запуск

```bash
npm install
npm run dev
```

Відкрий [http://localhost:3000](http://localhost:3000) — редірект на `/uk`.

```bash
npm run build
npm start
```

## Структура

```
app/
  (site)/[lang]/     # головна, каталог, товар
  api/products/      # JSON API з Cache-Control
components/          # layout, catalog, product, main-page
lib/                 # cache, providers, products, i18n
data/products.json
public/assets/       # зображення
```

## Env (опційно)

```bash
NEXT_PUBLIC_SITE_URL=https://logicclothes.ua
```
