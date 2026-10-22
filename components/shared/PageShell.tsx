"use client";

import { useLayoutEffect, type ReactNode } from "react";

type PageKind = "home" | "catalog" | "product";

export default function PageShell({
  kind,
  children,
}: {
  kind: PageKind;
  children: ReactNode;
}) {
  useLayoutEffect(() => {
    const body = document.body;
    body.classList.toggle("home-on", kind === "home");
    body.classList.toggle("catalog-on", kind === "catalog");
    body.classList.toggle("product-on", kind === "product");

    const bar = document.getElementById("site-bar");

    const syncStuck = () => {
      if (!bar) return;
      // Non-home pages: always solid fixed header.
      if (kind !== "home") {
        bar.classList.add("is-stuck");
        return;
      }
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      let stuck = scrollTop > 12;
      const hero = document.querySelector(".home-hero-stage");
      if (hero) {
        const heroBottom = hero.getBoundingClientRect().bottom;
        stuck = scrollTop > 12 || heroBottom < 72;
      }
      bar.classList.toggle("is-stuck", stuck);
    };

    syncStuck();
    window.addEventListener("scroll", syncStuck, { passive: true });
    window.addEventListener("resize", syncStuck, { passive: true });

    return () => {
      window.removeEventListener("scroll", syncStuck);
      window.removeEventListener("resize", syncStuck);
      body.classList.remove("home-on", "catalog-on", "product-on");
    };
  }, [kind]);

  return <>{children}</>;
}
