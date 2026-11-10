/** Persist unfinished admin forms so media cancel/delete doesn't wipe typed fields. */

export function readAdminFormDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeAdminFormDraft(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export function clearAdminFormDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function productFormDraftKey(productId?: string | null): string {
  return productId
    ? `lc-admin-product-edit:${productId}`
    : "lc-admin-product-create";
}

export const CATEGORY_FORM_DRAFT_KEY = "lc-admin-category-draft";
