import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSupportedLocale } from "@/lib/i18n/config";

function isAdminAuthenticated(request: NextRequest): boolean {
  const authCookie = request.cookies.get("admin_auth");
  if (!authCookie) return false;
  try {
    const decoded = Buffer.from(authCookie.value, "base64").toString();
    const [user, password] = decoded.split(":");
    return (
      user === process.env.ADMIN_USER && password === process.env.ADMIN_PASS
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Product uploads written at runtime are not always picked up by Next static
  // serving until restart — always stream them via the disk-backed API route.
  if (pathname.startsWith("/assets/products/")) {
    const filename = pathname.slice("/assets/products/".length);
    if (filename && !filename.includes("/") && !filename.includes("..")) {
      const url = request.nextUrl.clone();
      url.pathname = `/api/product-media/${encodeURIComponent(filename)}`;
      return NextResponse.rewrite(url);
    }
  }

  if (pathname.startsWith("/admin")) {
    const authed = isAdminAuthenticated(request);
    const isLogin = pathname === "/admin/login";

    if (authed && isLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (!authed && !isLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1] || "";
  if (isSupportedLocale(firstSegment)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/uk" : `/uk${pathname}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/assets/products/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|assets/|admin-icons/|feeds/|robots.txt|sitemap.xml|site.webmanifest|sw.js|.*\\..*).*)",
  ],
};
