import fs from "node:fs";
import path from "node:path";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "assets", "products");

let fileIndex: Map<string, string[]> | null = null;

function buildFileIndex(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!fs.existsSync(PRODUCTS_DIR)) return map;

  for (const name of fs.readdirSync(PRODUCTS_DIR)) {
    if (!/\.(jpe?g|png|webp)$/i.test(name)) continue;
    const url = `/assets/products/${name}`;
    const stem = name.replace(/_\d+_1\.(jpe?g|png|webp)$/i, "");
    const list = map.get(stem) ?? [];
    list.push(url);
    map.set(stem, list);
  }
  return map;
}

function indexBySlug(): Map<string, string[]> {
  if (!fileIndex) fileIndex = buildFileIndex();
  return fileIndex;
}

function fileExists(assetUrl: string): boolean {
  if (!assetUrl.startsWith("/")) return false;
  return fs.existsSync(path.join(process.cwd(), "public", assetUrl.slice(1)));
}

/** Fix legacy DB paths like `/assets/products/slug_1.jpg` when a real file exists. */
export function resolveProductAssetUrl(
  url: string,
  slug?: string
): string {
  if (!url || !url.startsWith("/assets/products/")) return url;
  if (fileExists(url)) return url;

  const idx = indexBySlug();
  const base = path.basename(url).replace(/_1\.(jpe?g|png|webp)$/i, "");

  if (slug) {
    const bySlug = idx.get(slug);
    if (bySlug?.[0]) return bySlug[0];
    const prefix = `${slug}_`;
    for (const name of fs.readdirSync(PRODUCTS_DIR)) {
      if (
        name.startsWith(prefix) &&
        /\.(jpe?g|png|webp)$/i.test(name) &&
        /_1\.(jpe?g|png|webp)$/i.test(name)
      ) {
        const candidate = `/assets/products/${name}`;
        if (fileExists(candidate)) return candidate;
      }
    }
  }

  const byBase = idx.get(base);
  if (byBase?.[0]) return byBase[0];

  return url;
}

export function resolveProductImages(
  images: string[],
  slug?: string
): string[] {
  return images.map((u) => resolveProductAssetUrl(u, slug));
}
