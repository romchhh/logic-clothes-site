"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface ContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isBasketOpen: boolean;
  setIsBasketOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isWishOpen: boolean;
  setIsWishOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closePanels: () => void;
}

const AppContext = createContext<ContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isWishOpen, setIsWishOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const closePanels = () => {
    setIsMenuOpen(false);
    setIsBasketOpen(false);
    setIsWishOpen(false);
    setIsSearchOpen(false);
  };

  const isOverlayOpen =
    isMenuOpen || isBasketOpen || isWishOpen || isSearchOpen;

  useScrollLock(isOverlayOpen);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMenuOpen);
  }, [isMenuOpen]);

  return (
    <AppContext.Provider
      value={{
        isMenuOpen,
        setIsMenuOpen,
        isBasketOpen,
        setIsBasketOpen,
        isWishOpen,
        setIsWishOpen,
        isSearchOpen,
        setIsSearchOpen,
        closePanels,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
