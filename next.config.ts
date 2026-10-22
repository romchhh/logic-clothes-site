import type { NextConfig } from "next";

const nextConfig = {
  serverExternalPackages: ["pg", "sharp"],
  images: {
    formats: ["image/webp", "image/avif"],
    // Trimmed sizes — fewer variants → faster image optimization & smaller build cache
    deviceSizes: [390, 640, 828, 1080, 1280, 1920],
    imageSizes: [48, 96, 160, 256, 384],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    optimizePackageImports: ["tailwind-merge"],
  },
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        // Product uploads change at runtime — do not mark immutable (404s would stick).
        source: "/assets/products/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/site.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
