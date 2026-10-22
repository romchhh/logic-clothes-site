import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/i18n/seo";
import { SITE_NAME } from "@/lib/siteContact";

export default function manifest(): MetadataRoute.Manifest {
  const base = getSiteUrl();
  return {
    name: SITE_NAME,
    short_name: "Logic",
    description: "Український бренд жіночого одягу · Concept store у Києві",
    start_url: "/uk",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#111111",
    lang: "uk",
    dir: "ltr",
    categories: ["shopping", "lifestyle", "fashion"],
    icons: [
      {
        src: `${base}/assets/logo-header.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/assets/logo-header.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
