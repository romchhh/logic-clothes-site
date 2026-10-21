export type { NovaWarehouseKind } from "@/lib/novaPoshtaShared";
import type { NovaWarehouseKind } from "@/lib/novaPoshtaShared";

type NpEnvelope = {
  success?: boolean;
  data?: Array<Record<string, unknown>>;
  errors?: unknown[];
};

async function getApiKey(): Promise<string> {
  // Public address methods work with an empty key; a personal key raises limits.
  const { resolveSetting } = await import("@/lib/settings");
  return resolveSetting("nova_poshta_api_key", [
    process.env.NOVA_POSHTA_API_KEY,
    process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY,
  ]);
}

async function callNovaPoshta(
  calledMethod: string,
  methodProperties: Record<string, unknown>
): Promise<NpEnvelope> {
  const res = await fetch("https://api.novaposhta.ua/v2.0/json/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: await getApiKey(),
      modelName: "AddressGeneral",
      calledMethod,
      methodProperties,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`np_http_${res.status}`);
  }

  return (await res.json()) as NpEnvelope;
}

function descriptions(data: NpEnvelope["data"]): string[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => String(row.Description || "").trim())
    .filter(Boolean);
}

function isLockerLabel(label: string): boolean {
  return /поштомат|postomat|locker/i.test(label);
}

export async function searchNovaCities(query: string): Promise<string[]> {
  const envelope = await callNovaPoshta("getCities", {
    FindByString: query.trim(),
    Limit: 20,
  });
  if (!envelope.success) {
    throw new Error("np_cities_failed");
  }
  return descriptions(envelope.data);
}

async function resolveCityRef(city: string): Promise<string | null> {
  const name = city.trim();
  if (!name) return null;

  const envelope = await callNovaPoshta("getCities", {
    FindByString: name,
    Limit: 10,
  });
  if (!envelope.success || !Array.isArray(envelope.data)) return null;

  const exact = envelope.data.find(
    (row) =>
      String(row.Description || "").trim().toLowerCase() === name.toLowerCase()
  );
  const row = exact || envelope.data[0];
  const ref = String(row?.Ref || "").trim();
  return ref || null;
}

export async function searchNovaWarehouses(
  city: string,
  query: string,
  kind: NovaWarehouseKind = "branch"
): Promise<string[]> {
  const cityName = city.trim();
  const find = query.trim();
  const cityRef = await resolveCityRef(cityName);

  const base: Record<string, unknown> = {
    Limit: 50,
  };
  if (cityRef) {
    base.CityRef = cityRef;
  } else {
    base.CityName = cityName;
  }
  if (find) base.FindByString = find;

  // API accepts CategoryOfWarehouse=Postomat, but "Branch" is invalid.
  const props =
    kind === "locker"
      ? { ...base, CategoryOfWarehouse: "Postomat" }
      : { ...base };

  const envelope = await callNovaPoshta("getWarehouses", props);
  let list = envelope.success ? descriptions(envelope.data) : [];

  // Fallback: plain CityName search without ref / category.
  if (!list.length) {
    const fallback = await callNovaPoshta("getWarehouses", {
      CityName: cityName,
      ...(find ? { FindByString: find } : {}),
      Limit: 50,
    });
    if (!fallback.success) {
      const detail = Array.isArray(fallback.errors)
        ? fallback.errors.join("; ")
        : "unknown";
      throw new Error(`np_warehouses_failed: ${detail}`);
    }
    list = descriptions(fallback.data);
  }

  if (kind === "locker") {
    const lockers = list.filter(isLockerLabel);
    return (lockers.length ? lockers : list).slice(0, 20);
  }

  const branches = list.filter((d) => !isLockerLabel(d));
  return (branches.length ? branches : list).slice(0, 20);
}
