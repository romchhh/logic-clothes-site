/** Length chip values stored in the DB → storefront label. */
export function formatLengthLabel(value: string): string {
  const t = value.trim();
  if (t.toLowerCase() === "midi") return "Middle";
  return value;
}