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
import type { WishlistItem } from "@/lib/types";

interface WishlistContextType {
  items: WishlistItem[];
  isWished: (id: string) => boolean;
  toggleWish: (item: WishlistItem) => void;
  removeWish: (id: string) => void;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);
const LOCAL_STORAGE_KEY = "lc-wish";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      if (Array.isArray(saved)) setItems(saved);
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

  const isWished = useCallback(
    (id: string) => items.some((x) => x.id === id),
    [items]
  );

  const toggleWish = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((x) => x.id === item.id);
      if (exists) return prev.filter((x) => x.id !== item.id);
      return [...prev, item];
    });
  }, []);

  const removeWish = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      items,
      isWished,
      toggleWish,
      removeWish,
      count: items.length,
    }),
    [items, isWished, toggleWish, removeWish]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
