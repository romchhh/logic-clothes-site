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

    const onScroll = () => {
      const bar = document.getElementById("site-bar");
      if (!bar) return;
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const solid = kind === "catalog" || kind === "product";
      let stuck = scrollTop > 12;

      if (kind === "home") {
        const hero = document.querySelector(".home-hero-stage");
        if (hero) {
          const heroBottom = hero.getBoundingClientRect().bottom;
          stuck = scrollTop > 12 || heroBottom < 72;
        }
        bar.classList.toggle("is-stuck", stuck);
      } else {
        bar.classList.toggle("is-stuck", stuck || solid);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      body.classList.remove("home-on", "catalog-on", "product-on");
    };
  }, [kind]);

  return <>{children}</>;
}
