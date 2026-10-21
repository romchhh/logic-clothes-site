export type NovaWarehouseKind = "branch" | "locker";

export function rankSuggestions(items: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return [...items].sort((a, b) => {
    const al = a.toLowerCase();
    const bl = b.toLowerCase();
    if (al === q) return -1;
    if (bl === q) return 1;
    const aStarts = al.startsWith(q);
    const bStarts = bl.startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return a.localeCompare(b, "uk");
  });
}
