import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/i18n/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/*/final",
          "/*/wishlist",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
