/** Persist unfinished admin forms (survives accidental leave / reload). */

export function readAdminFormDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeAdminFormDraft(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(key, raw);
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  } catch {
    /* quota / private mode — fall back to session */
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }
}

export function clearAdminFormDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
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
