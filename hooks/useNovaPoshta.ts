"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  rankSuggestions,
  type NovaWarehouseKind,
} from "@/lib/novaPoshtaShared";

async function postNp(body: Record<string, unknown>): Promise<string[]> {
  const res = await fetch("/api/nova-poshta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.items) ? data.items.map(String) : [];
}

export function useNovaPoshta({
  enabled,
  city,
  address,
  warehouseKind,
}: {
  enabled: boolean;
  city: string;
  address: string;
  warehouseKind: NovaWarehouseKind | null;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const cityReq = useRef(0);
  const whReq = useRef(0);

  const searchCities = useCallback(async (query: string) => {
    const id = ++cityReq.current;
    setLoadingCities(true);
    try {
      const items = await postNp({ action: "cities", query });
      if (id === cityReq.current) setCities(items);
    } finally {
      if (id === cityReq.current) setLoadingCities(false);
    }
  }, []);

  const searchWarehouses = useCallback(
    async (cityName: string, query: string, kind: NovaWarehouseKind) => {
      const id = ++whReq.current;
      setLoadingWarehouses(true);
      try {
        const items = await postNp({
          action: "warehouses",
          city: cityName,
          query,
          kind,
        });
        if (id === whReq.current) setWarehouses(items);
      } finally {
        if (id === whReq.current) setLoadingWarehouses(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!enabled) {
      setCities([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchCities(city);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [enabled, city, searchCities]);

  useEffect(() => {
    if (!enabled || !warehouseKind || !city.trim()) {
      setWarehouses([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchWarehouses(city, address, warehouseKind);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [enabled, warehouseKind, city, address, searchWarehouses]);

  return {
    filteredCities: rankSuggestions(cities, city),
    filteredWarehouses: rankSuggestions(warehouses, address),
    loadingCities,
    loadingWarehouses,
  };
}
