import { NextResponse } from "next/server";
import { isSupportedLocale } from "@/lib/i18n/config";
import { buildGoogleMerchantXml } from "@/lib/feeds";

export const runtime = "nodejs";
export const revalidate = 300;

type Ctx = { params: Promise<{ lang: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { lang: raw } = await ctx.params;
  const lang = raw.replace(/\.xml$/i, "");
  if (!isSupportedLocale(lang)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const xml = await buildGoogleMerchantXml(lang);
  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
