/** Client-safe helpers shared by admin order screens (no fs imports). */

export type OrderStatus = "new" | "processing" | "done" | "cancelled";

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "Нове" },
  { value: "processing", label: "В обробці" },
  { value: "done", label: "Виконано" },
  { value: "cancelled", label: "Скасовано" },
];

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function orderStatusBadgeColor(
  status: string
): "primary" | "warning" | "success" | "error" | "light" {
  switch (status) {
    case "new":
      return "primary";
    case "processing":
      return "warning";
    case "done":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "light";
  }
}

export const DELIVERY_LABELS: Record<string, string> = {
  nova_poshta_branch: "Нова Пошта — відділення",
  nova_poshta_locker: "Нова Пошта — поштомат",
  nova_poshta_courier: "Нова Пошта — кур'єр",
  pickup: "Самовивіз",
  international: "Міжнародна доставка",
};

export function deliveryLabel(method: string): string {
  return DELIVERY_LABELS[method] ?? method;
}

export function formatAdminDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminMoney(n: number): string {
  return `${(Number(n) || 0).toLocaleString("uk-UA")} ₴`;
}
