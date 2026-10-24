import { revalidatePath, revalidateTag } from "next/cache";

declare global {
  // eslint-disable-next-line no-var
  var __lcProductsEpoch: number | undefined;
}

/** Bumps in-process cache key so unstable_cache cannot serve a stale list. */
export function bumpProductsEpoch(): number {
  const next = (globalThis.__lcProductsEpoch ?? 0) + 1;
  globalThis.__lcProductsEpoch = next;
  return next;
}

export function getProductsEpoch(): number {
  return globalThis.__lcProductsEpoch ?? 0;
}

/**
 * Invalidate Next Data Cache + Full Route Cache after product mutations.
 * Also bumps a process-local epoch so the next getProducts() cannot reuse
 * a stale unstable_cache entry even if tag revalidation is delayed.
 */
export function bustProductCache(): void {
  bumpProductsEpoch();

  try {
    revalidateTag("products");
  } catch (err) {
    console.warn(
      "[products] revalidateTag failed:",
      err instanceof Error ? err.message : err
    );
  }

  const paths = [
    "/uk",
    "/en",
    "/uk/catalog",
    "/en/catalog",
    "/api/products",
  ] as const;

  for (const path of paths) {
    try {
      revalidatePath(path);
      revalidatePath(path, "layout");
      revalidatePath(path, "page");
    } catch (err) {
      console.warn(
        `[products] revalidatePath(${path}) failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}
