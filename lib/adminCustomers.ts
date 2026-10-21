import type { StoredOrder } from "@/lib/sql";
import type { DeliveryMethod } from "@/lib/types";

export type CustomerAddress = {
  city: string;
  address: string;
  deliveryMethod: DeliveryMethod | string;
  orderCount: number;
  lastUsedAt: string;
};

export type CustomerSummary = {
  id: string;
  phone: string;
  phoneDisplay: string;
  name: string;
  email?: string;
  city?: string;
  orderCount: number;
  activeOrderCount: number;
  totalSpent: number;
  lastOrderAt: string;
  firstOrderAt: string;
};

export type CustomerDetail = CustomerSummary & {
  names: string[];
  emails: string[];
  locales: string[];
  addresses: CustomerAddress[];
  orders: StoredOrder[];
};

/** Normalize phone to digits for grouping (UA-friendly). */
export function normalizeCustomerPhone(phone: string): string {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = `38${digits}`;
  } else if (digits.length === 9) {
    digits = `380${digits}`;
  } else if (digits.length === 12 && digits.startsWith("380")) {
    // ok
  } else if (digits.length === 11 && digits.startsWith("80")) {
    digits = `3${digits}`;
  }
  return digits;
}

export function formatCustomerPhone(digits: string): string {
  const d = normalizeCustomerPhone(digits);
  if (d.length === 12 && d.startsWith("380")) {
    return `+${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
  }
  return digits.startsWith("+") ? digits : digits ? `+${digits}` : "—";
}

function isActiveOrder(status: StoredOrder["status"]): boolean {
  return status !== "cancelled";
}

export function buildCustomersFromOrders(
  orders: StoredOrder[]
): CustomerSummary[] {
  const map = new Map<
    string,
    {
      phoneRaw: string;
      name: string;
      email?: string;
      city?: string;
      orderCount: number;
      activeOrderCount: number;
      totalSpent: number;
      lastOrderAt: string;
      firstOrderAt: string;
    }
  >();

  const sorted = [...orders].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const order of sorted) {
    const id = normalizeCustomerPhone(order.phone);
    if (!id) continue;
    const existing = map.get(id);
    const active = isActiveOrder(order.status);
    if (!existing) {
      map.set(id, {
        phoneRaw: order.phone,
        name: order.customerName || "Без імені",
        email: order.email,
        city: order.city,
        orderCount: 1,
        activeOrderCount: active ? 1 : 0,
        totalSpent: active ? Number(order.total) || 0 : 0,
        lastOrderAt: order.createdAt,
        firstOrderAt: order.createdAt,
      });
      continue;
    }
    existing.orderCount += 1;
    if (active) {
      existing.activeOrderCount += 1;
      existing.totalSpent += Number(order.total) || 0;
    }
    if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
      existing.lastOrderAt = order.createdAt;
      existing.phoneRaw = order.phone || existing.phoneRaw;
      existing.name = order.customerName || existing.name;
      if (order.email) existing.email = order.email;
      if (order.city) existing.city = order.city;
    }
    if (new Date(order.createdAt) < new Date(existing.firstOrderAt)) {
      existing.firstOrderAt = order.createdAt;
    }
  }

  return Array.from(map.entries())
    .map(([id, row]) => ({
      id,
      phone: row.phoneRaw,
      phoneDisplay: formatCustomerPhone(id),
      name: row.name,
      ...(row.email ? { email: row.email } : {}),
      ...(row.city ? { city: row.city } : {}),
      orderCount: row.orderCount,
      activeOrderCount: row.activeOrderCount,
      totalSpent: row.totalSpent,
      lastOrderAt: row.lastOrderAt,
      firstOrderAt: row.firstOrderAt,
    }))
    .sort(
      (a, b) =>
        new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
    );
}

export function buildCustomerDetail(
  orders: StoredOrder[],
  customerId: string
): CustomerDetail | null {
  const id = normalizeCustomerPhone(customerId);
  if (!id) return null;

  const customerOrders = orders
    .filter((o) => normalizeCustomerPhone(o.phone) === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  if (!customerOrders.length) return null;

  const summaries = buildCustomersFromOrders(customerOrders);
  const summary = summaries[0];
  if (!summary) return null;

  const names = Array.from(
    new Set(
      customerOrders
        .map((o) => o.customerName?.trim())
        .filter((n): n is string => Boolean(n))
    )
  );
  const emails = Array.from(
    new Set(
      customerOrders
        .map((o) => o.email?.trim())
        .filter((e): e is string => Boolean(e))
    )
  );
  const locales = Array.from(
    new Set(
      customerOrders
        .map((o) => o.locale?.trim())
        .filter((l): l is string => Boolean(l))
    )
  );

  const addressMap = new Map<string, CustomerAddress>();
  for (const order of customerOrders) {
    const city = order.city?.trim() || "";
    const address = order.address?.trim() || "";
    if (!city && !address) continue;
    const key = `${order.deliveryMethod}|${city}|${address}`;
    const existing = addressMap.get(key);
    if (!existing) {
      addressMap.set(key, {
        city,
        address,
        deliveryMethod: order.deliveryMethod,
        orderCount: 1,
        lastUsedAt: order.createdAt,
      });
    } else {
      existing.orderCount += 1;
      if (new Date(order.createdAt) > new Date(existing.lastUsedAt)) {
        existing.lastUsedAt = order.createdAt;
      }
    }
  }

  return {
    ...summary,
    names,
    emails,
    locales,
    addresses: Array.from(addressMap.values()).sort(
      (a, b) =>
        new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
    ),
    orders: customerOrders,
  };
}
