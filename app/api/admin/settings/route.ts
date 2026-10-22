import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { bustHeroCache } from "@/lib/hero";
import {
  SETTING_KEYS,
  getSettingsForAdmin,
  type SettingKey,
  upsertSettings,
} from "@/lib/settings";
import { HERO_SETTING_KEYS } from "@/lib/settingsTypes";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const data = await getSettingsForAdmin();
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const patch: Partial<Record<SettingKey, string>> = {};
    for (const key of SETTING_KEYS) {
      if (body[key] != null) patch[key] = String(body[key]);
    }
    await upsertSettings(patch);
    const touchedHero = HERO_SETTING_KEYS.some((k) => k in patch);
    if (touchedHero) bustHeroCache();
    const data = await getSettingsForAdmin();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PUT /api/admin/settings]", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
