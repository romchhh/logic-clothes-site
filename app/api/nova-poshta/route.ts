import { NextRequest, NextResponse } from "next/server";
import {
  searchNovaCities,
  searchNovaWarehouses,
  type NovaWarehouseKind,
} from "@/lib/novaPoshta";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;

    if (action === "cities") {
      const query = String(body.query || "");
      const cities = await searchNovaCities(query);
      return NextResponse.json({ ok: true, items: cities });
    }

    if (action === "warehouses") {
      const city = String(body.city || "").trim();
      if (!city) {
        return NextResponse.json(
          { error: "city_required" },
          { status: 400 }
        );
      }
      const query = String(body.query || "");
      const kind: NovaWarehouseKind =
        body.kind === "locker" ? "locker" : "branch";
      const warehouses = await searchNovaWarehouses(city, query, kind);
      return NextResponse.json({ ok: true, items: warehouses });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (error) {
    console.error("[POST /api/nova-poshta]", error);
    return NextResponse.json({ error: "np_failed" }, { status: 502 });
  }
}
