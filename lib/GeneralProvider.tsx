"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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

  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (!isOverlayOpen) {
      if (body.dataset.appOverlayLock === "1") {
        body.style.overflow = body.dataset.appOverlayPrevOverflow || "";
        body.style.paddingRight = body.dataset.appOverlayPrevPadding || "";
        delete body.dataset.appOverlayLock;
        delete body.dataset.appOverlayPrevOverflow;
        delete body.dataset.appOverlayPrevPadding;
      }
      return;
    }

    if (body.dataset.appOverlayLock !== "1") {
      body.dataset.appOverlayPrevOverflow = body.style.overflow;
      body.dataset.appOverlayPrevPadding = body.style.paddingRight;
      body.dataset.appOverlayLock = "1";
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      if (body.dataset.appOverlayLock === "1") {
        body.style.overflow = body.dataset.appOverlayPrevOverflow || "";
        body.style.paddingRight = body.dataset.appOverlayPrevPadding || "";
        delete body.dataset.appOverlayLock;
        delete body.dataset.appOverlayPrevOverflow;
        delete body.dataset.appOverlayPrevPadding;
      }
    };
  }, [isOverlayOpen]);

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
