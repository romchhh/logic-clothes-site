"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BasketItem } from "@/lib/types";

interface BasketContextType {
  items: BasketItem[];
  addItem: (item: Omit<BasketItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearBasket: () => void;
  total: number;
  count: number;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = "lc-cart";

function normalizeItems(raw: unknown): BasketItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Partial<BasketItem>;
      if (!row.id || !row.size) return null;
      return {
        id: String(row.id),
        name: String(row.name || ""),
        price: String(row.price || ""),
        priceNum: Number(row.priceNum) || 0,
        size: String(row.size),
        ...(row.sizeLabel ? { sizeLabel: String(row.sizeLabel) } : {}),
        ...(row.length ? { length: String(row.length) } : {}),
        ...(row.material ? { material: String(row.material) } : {}),
        ...(row.color ? { color: String(row.color) } : {}),
        quantity: Math.max(1, Number(row.quantity) || 1),
        image: String(row.image || ""),
      } satisfies BasketItem;
    })
    .filter((x): x is BasketItem => !!x);
}

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      setItems(normalizeItems(saved));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<BasketItem, "quantity"> & { quantity?: number }) => {
      const qty = Math.max(1, item.quantity || 1);
      setItems((prev) => {
        const idx = prev.findIndex(
          (x) => x.id === item.id && x.size === item.size
        );
        if (idx === -1) {
          return [...prev, { ...item, quantity: qty }];
        }
        return prev.map((x, i) =>
          i === idx ? { ...x, quantity: x.quantity + qty } : x
        );
      });
    },
    []
  );

  const removeItem = useCallback((id: string, size: string) => {
    setItems((prev) => prev.filter((x) => !(x.id === id && x.size === size)));
  }, []);

  const updateQuantity = useCallback(
    (id: string, size: string, quantity: number) => {
      if (quantity < 1) {
        setItems((prev) =>
          prev.filter((x) => !(x.id === id && x.size === size))
        );
        return;
      }
      setItems((prev) =>
        prev.map((x) =>
          x.id === id && x.size === size ? { ...x, quantity } : x
        )
      );
    },
    []
  );

  const clearBasket = useCallback(() => setItems([]), []);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.priceNum || 0) * (item.quantity || 1),
        0
      ),
    [items]
  );

  const count = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 1), 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearBasket,
      total,
      count,
    }),
    [items, addItem, removeItem, updateQuantity, clearBasket, total, count]
  );

  return (
    <BasketContext.Provider value={value}>{children}</BasketContext.Provider>
  );
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used within BasketProvider");
  return ctx;
}
