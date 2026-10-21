import type { Locale } from "@/lib/i18n/config";

export function switchLocalePath(
  pathname: string,
  from: Locale,
  to: Locale
): string {
  return pathname.replace(`/${from}`, `/${to}`) || `/${to}`;
}
