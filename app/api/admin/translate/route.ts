import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";

type Pair = "uk|en" | "en|uk";

async function translateMyMemory(text: string, pair: Pair): Promise<string> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text.slice(0, 450));
  url.searchParams.set("langpair", pair);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`translate_http_${res.status}`);
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
  };
  const out = data.responseData?.translatedText?.trim() || "";
  if (!out) throw new Error("empty_translation");
  return out;
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const text = String(body.text || "").trim();
    const from = body.from === "en" ? "en" : "uk";
    const to = body.to === "uk" ? "uk" : "en";
    if (!text) {
      return NextResponse.json({ error: "text_required" }, { status: 400 });
    }
    if (from === to) {
      return NextResponse.json({ text });
    }

    const pair = `${from}|${to}` as Pair;
    // Chunk long text by paragraphs
    const parts = text.split(/\n+/).filter(Boolean);
    const translated: string[] = [];
    for (const part of parts) {
      translated.push(await translateMyMemory(part, pair));
    }
    return NextResponse.json({ text: translated.join("\n\n") });
  } catch (error) {
    console.error("[POST /api/admin/translate]", error);
    return NextResponse.json({ error: "translate_failed" }, { status: 502 });
  }
}
