import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/i18n/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  const privatePaths = [
    "/admin/",
    "/api/",
    "/*/final",
    "/*/wishlist",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: privatePaths,
      },
      // AI crawlers — allow public content, block private surfaces
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
