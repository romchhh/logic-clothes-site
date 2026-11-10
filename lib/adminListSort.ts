export type AdminListSort = "name-asc" | "name-desc" | "date-desc" | "date-asc";

export function parseAdminListSort(
  v: string | null | undefined
): AdminListSort {
  if (
    v === "name-asc" ||
    v === "name-desc" ||
    v === "date-desc" ||
    v === "date-asc"
  ) {
    return v;
  }
  return "name-asc";
}

export function sortByNameAndDate<T extends { name: string; createdAt?: string }>(
  list: T[],
  sort: AdminListSort
): T[] {
  const next = [...list];
  if (sort === "name-asc") {
    next.sort((a, b) => a.name.localeCompare(b.name, "uk"));
  } else if (sort === "name-desc") {
    next.sort((a, b) => b.name.localeCompare(a.name, "uk"));
  } else if (sort === "date-desc") {
    next.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
  } else {
    next.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return ta - tb;
    });
  }
  return next;
}

export const ADMIN_LIST_SORT_OPTIONS: { value: AdminListSort; label: string }[] =
  [
    { value: "name-asc", label: "А → Я" },
    { value: "name-desc", label: "Я → А" },
    { value: "date-desc", label: "Додано: новіші" },
    { value: "date-asc", label: "Додано: старіші" },
  ];
