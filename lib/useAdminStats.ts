"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoredOrder } from "@/lib/adminStore";

export type AdminStats = {
  products: number;
  inStock: number;
  orders: number;
  newOrders: number;
  revenue: number;
  recentOrders: StoredOrder[];
};

// Share one in-flight request between components mounted at the same time.
let inflight: Promise<AdminStats> | null = null;

function fetchStats(): Promise<AdminStats> {
  if (!inflight) {
    inflight = fetch("/api/admin/stats", {
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<AdminStats>;
      })
      .finally(() => {
        // Allow a fresh request on the next mount / manual refresh.
        setTimeout(() => {
          inflight = null;
        }, 0);
      });
  }
  return inflight;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await fetchStats());
    } catch (e) {
      console.error("Error fetching admin stats:", e);
      setError("Не вдалося завантажити статистику");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
