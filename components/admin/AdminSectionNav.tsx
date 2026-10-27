"use client";

import React, { useEffect, useState } from "react";

export type AdminSection = { id: string; label: string };

type Props = {
  sections: AdminSection[];
  className?: string;
};

export default function AdminSectionNav({ sections, className = "" }: Props) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (!sections.length) return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav
      className={`admin-section-nav ${className}`}
      aria-label="Розділи сторінки"
    >
      <div className="admin-section-nav-inner custom-scrollbar">
        {sections.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`admin-section-nav-link${isActive ? " is-active" : ""}`}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
