"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSectionNav from "@/components/admin/AdminSectionNav";
import ComponentCard from "@/components/admin/ComponentCard";
import ColorPalettePicker, {
  type PaletteSelection,
} from "@/components/admin/ColorPalettePicker";
import {
  getPaletteColor,
  productPaletteSelection,
  swatchesFromPaletteIds,
} from "@/lib/colorPalette";
import ProductMediaManager from "@/components/admin/ProductMediaManager";
import ProductRelationPicker from "@/components/admin/ProductRelationPicker";
import AdminChipField from "@/components/admin/AdminChipField";
import ModelPresetPicker from "@/components/admin/ModelPresetPicker";
import Label from "@/components/admin/form/Label";
import Input from "@/components/admin/form/input/InputField";
import TextArea from "@/components/admin/form/input/TextArea";
import Select from "@/components/admin/form/Select";
import ToggleSwitch from "@/components/admin/form/ToggleSwitch";
import { getAdminProductsListHref } from "@/lib/adminProductsListState";
import type { Category } from "@/lib/categories";
import { CACHE_KEYS, clearCachedData } from "@/lib/cache";
import { UAH_PER_EUR } from "@/lib/format";
import {
  loadCompositionSuggestions,
  loadFabricNameSuggestions,
  rememberCompositions,
  rememberFabricNames,
  rememberFromCatalog,
  rememberFromProduct,
} from "@/lib/adminProductPresets";
import { ADMIN_SIZE_PRESETS } from "@/lib/productSizes";
import {
  emptyGarmentMeasures,
  GARMENT_MEASURE_FIELDS,
  type GarmentMeasureKey,
} from "@/lib/garmentMeasures";
import {
  categorySupportsSeasonFilter,
  normalizeProductSeason,
} from "@/lib/productSeason";
import type { Product, ProductMedia } from "@/lib/types";

const PRESET_LENGTHS = ["Mini", "Midi", "Maxi", "Crop", "Long"];
const PRESET_FABRIC_NAMES = [
  "Шовк",
  "Бавовна",
  "Льон",
  "Вовна",
  "Трикотаж",
  "Віскоза",
  "Шкіра",
  "Екошкіра",
  "Денім",
];

type Props = { productId?: string };

type FormState = {
  nameUk: string;
  nameEn: string;
  id: string;
  priceUah: string;
  priceEur: string;
  priceUsd: string;
  compareAtUah: string;
  category: string;
  material: string;
  photoSize: string;
  modelParams: string;
  garmentMeasures: Record<GarmentMeasureKey, string>;
  sizeOptions: string[];
  lengthOptions: string[];
  materialOptions: string[];
  descriptionUk: string;
  descriptionEn: string;
  sortOrder: string;
  inStock: boolean;
  madeToOrder: boolean;
  /** Apparel season — mutually exclusive summer/winter. */
  season: "summer" | "winter" | null;
  /** Draft = not published to the storefront. */
  isDraft: boolean;
  isNew: boolean;
  isPopular: boolean;
  isSale: boolean;
  media: ProductMedia[];
};

const PRODUCT_FORM_SECTIONS = [
  { id: "section-name", label: "Назва" },
  { id: "section-price", label: "Ціна" },
  { id: "section-category", label: "Каталог" },
  { id: "section-color", label: "Колір" },
  { id: "section-sizes", label: "Розміри" },
  { id: "section-variants", label: "Варіації" },
  { id: "section-material", label: "Склад" },
  { id: "section-description", label: "Опис" },
  { id: "section-media", label: "Фото" },
  { id: "section-links", label: "Звʼязки" },
] as const;

const EMPTY: FormState = {
  nameUk: "",
  nameEn: "",
  id: "",
  priceUah: "",
  priceEur: "",
  priceUsd: "",
  compareAtUah: "",
  category: "",
  material: "",
  photoSize: "",
  modelParams: "",
  garmentMeasures: emptyGarmentMeasures(),
  sizeOptions: ["S", "M", "L"],
  lengthOptions: [],
  materialOptions: [],
  descriptionUk: "",
  descriptionEn: "",
  sortOrder: "",
  inStock: true,
  madeToOrder: false,
  season: null,
  isDraft: true,
  isNew: false,
  isPopular: false,
  isSale: false,
  media: [],
};

async function translateText(
  text: string,
  from: "uk" | "en",
  to: "uk" | "en"
): Promise<string> {
  const res = await fetch("/api/admin/translate", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, from, to }),
  });
  if (!res.ok) throw new Error("translate_failed");
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() || "";
}

function TranslateBtn({
  onClick,
  busy,
}: {
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="admin-btn-mint"
    >
      {busy ? "Переклад…" : "⇄ Автопереклад"}
    </button>
  );
}

export default function ProductForm({ productId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [customLength, setCustomLength] = useState("");
  const [fabricSuggestions, setFabricSuggestions] = useState<string[]>([]);
  const [compositionSuggestions, setCompositionSuggestions] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [baseCategoryOptions, setBaseCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [colorVariantIds, setColorVariantIds] = useState<string[]>([]);
  const [paletteSelection, setPaletteSelection] = useState<PaletteSelection>({
    ids: [],
    primaryId: null,
  });
  const [lookProductIds, setLookProductIds] = useState<string[]>([]);
  const [eurManual, setEurManual] = useState(false);

  const set = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [catsRes, productsRes] = await Promise.all([
          fetch("/api/admin/categories", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/admin/products", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        if (catsRes.ok) {
          const data = (await catsRes.json()) as Category[];
          if (!cancelled && Array.isArray(data)) {
            setBaseCategoryOptions(
              data
                .filter((c) => c.kind === "category")
                .map((c) => ({ value: c.id, label: c.label.uk }))
            );
          }
        }
        if (productsRes.ok) {
          const data = (await productsRes.json()) as Product[];
          if (!cancelled && Array.isArray(data)) setCatalog(data);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setFabricSuggestions(loadFabricNameSuggestions());
    setCompositionSuggestions(loadCompositionSuggestions());
  }, []);

  useEffect(() => {
    if (!catalog.length) return;
    rememberFromCatalog(catalog);
    setFabricSuggestions(loadFabricNameSuggestions());
    setCompositionSuggestions(loadCompositionSuggestions());
  }, [catalog]);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        const [res, productsRes] = await Promise.all([
          fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch("/api/admin/products", {
            credentials: "include",
            cache: "no-store",
          }),
        ]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const p = (await res.json()) as Product;
        if (cancelled) return;
        let allProducts: Product[] = [];
        if (productsRes.ok) {
          const list = (await productsRes.json()) as Product[];
          if (Array.isArray(list)) allProducts = list;
        }
        if (!cancelled && allProducts.length) setCatalog(allProducts);
        if (p.colorGroup) {
          setColorVariantIds(
            allProducts
              .filter(
                (x) => x.colorGroup === p.colorGroup && x.id !== productId
              )
              .map((x) => x.id)
          );
        } else {
          setColorVariantIds([]);
        }
        const media: ProductMedia[] =
          p.media?.length
            ? p.media
            : (p.images || []).map((url) => ({ url, type: "image" as const }));
        setForm({
          nameUk: p.name ?? "",
          nameEn: p.nameEn ?? "",
          id: p.id,
          priceUah: String(p.priceNum ?? ""),
          priceEur:
            p.priceEur != null
              ? String(p.priceEur)
              : p.priceNum
                ? String(Math.max(1, Math.round(p.priceNum / UAH_PER_EUR)))
                : "",
          priceUsd:
            p.priceUsd != null && p.priceUsd > 0 ? String(p.priceUsd) : "",
          compareAtUah:
            p.compareAtPriceNum != null ? String(p.compareAtPriceNum) : "",
          category: p.category ?? "",
          material: p.material ?? "",
          photoSize: p.photoSize ?? "",
          modelParams: p.modelParams ?? "",
          garmentMeasures: {
            ...emptyGarmentMeasures(),
            ...(p.garmentMeasures ?? {}),
          },
          sizeOptions: Array.isArray(p.sizeOptions) ? p.sizeOptions : [],
          lengthOptions: Array.isArray(p.lengthOptions) ? p.lengthOptions : [],
          materialOptions: Array.isArray(p.materialOptions)
            ? p.materialOptions
            : [],
          descriptionUk:
            (p.description || p.longDescription || "").trim() || "",
          descriptionEn:
            (p.descriptionEn || p.longDescriptionEn || "").trim() || "",
          sortOrder:
            p.sortOrder != null ? String(p.sortOrder) : "0",
          inStock: p.inStock !== false,
          madeToOrder: Boolean(p.madeToOrder),
          season: normalizeProductSeason(p.season),
          isDraft: p.isVisible === false,
          isNew: Boolean(p.isNew),
          isPopular: Boolean(p.isPopular),
          isSale: Boolean(p.isSale),
          media,
        });
        setEurManual(p.priceEur != null);
        setPaletteSelection(productPaletteSelection(p));
        setLookProductIds(
          Array.isArray(p.lookProductIds) ? p.lookProductIds : []
        );
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Не вдалося завантажити товар");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Auto EUR from UAH unless manually overridden
  useEffect(() => {
    if (eurManual) return;
    const uah = Number(form.priceUah);
    if (!Number.isFinite(uah) || uah <= 0) return;
    setForm((prev) => ({
      ...prev,
      priceEur: String(Math.max(1, Math.round(uah / UAH_PER_EUR))),
    }));
  }, [form.priceUah, eurManual]);

  const categoryOptions = React.useMemo(() => {
    if (
      form.category &&
      !baseCategoryOptions.some((o) => o.value === form.category)
    ) {
      return [
        ...baseCategoryOptions,
        { value: form.category, label: form.category },
      ];
    }
    return baseCategoryOptions;
  }, [form.category, baseCategoryOptions]);

  const runTranslate = async (
    key: string,
    text: string,
    from: "uk" | "en",
    to: "uk" | "en",
    apply: (t: string) => void
  ) => {
    if (!text.trim()) return;
    setTranslating(key);
    try {
      apply(await translateText(text, from, to));
    } catch {
      setError("Не вдалося перекласти — спробуйте ще раз");
    } finally {
      setTranslating(null);
    }
  };

  const toggleOption = (
    key: "sizeOptions" | "lengthOptions" | "materialOptions",
    value: string
  ) =>
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((s) => s !== value)
        : [...prev[key], value],
    }));

  const addCustomParts = (
    key: "sizeOptions" | "lengthOptions" | "materialOptions",
    raw: string,
    clear: () => void
  ) => {
    const parts = raw
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setForm((prev) => ({
      ...prev,
      [key]: Array.from(new Set([...prev[key], ...parts])),
    }));
    clear();
  };

  async function saveProduct(opts?: { asDraft?: boolean }) {
    setError(null);
    const asDraft = opts?.asDraft ?? form.isDraft;

    if (!form.nameUk.trim()) {
      setError("Вкажіть назву (UK)");
      return;
    }
    const priceNum = Number(form.priceUah);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Вкажіть коректну ціну в грн");
      return;
    }
    if (!asDraft && priceNum <= 0) {
      setError("Щоб опублікувати, вкажіть ціну більше 0");
      return;
    }
    const priceEur = Number(form.priceEur);
    const priceUsd = form.priceUsd.trim() ? Number(form.priceUsd) : null;
    const compareAt = form.compareAtUah.trim()
      ? Number(form.compareAtUah)
      : null;

    // Auto-fill EN if empty
    let nameEn = form.nameEn.trim();
    let descriptionEn = form.descriptionEn.trim();
    try {
      if (!nameEn && form.nameUk.trim()) {
        nameEn = await translateText(form.nameUk, "uk", "en");
      }
      if (!descriptionEn && form.descriptionUk.trim()) {
        descriptionEn = await translateText(form.descriptionUk, "uk", "en");
      }
    } catch {
      /* keep empty EN */
    }

    rememberFabricNames(form.materialOptions);
    if (form.material.trim()) {
      rememberCompositions([form.material.trim()]);
    }

    if (!paletteSelection.ids.length || !paletteSelection.primaryId) {
      setError("Оберіть хоча б один колір з палітри");
      return;
    }
    const primaryColor = getPaletteColor(paletteSelection.primaryId);
    if (!primaryColor) {
      setError("Оберіть коректний колір з палітри");
      return;
    }

    const descriptionUk = form.descriptionUk.trim();
    const images = form.media
      .filter((m) => m.type === "image")
      .map((m) => m.url);
    const payload: Record<string, unknown> = {
      name: form.nameUk.trim(),
      nameEn,
      priceNum,
      priceEur: Number.isFinite(priceEur) && priceEur > 0 ? priceEur : null,
      priceUsd:
        priceUsd != null && Number.isFinite(priceUsd) && priceUsd > 0
          ? priceUsd
          : null,
      compareAtPriceNum:
        compareAt != null && Number.isFinite(compareAt) && compareAt > 0
          ? compareAt
          : null,
      category: form.category,
      color: primaryColor.label,
      colorHex: primaryColor.hex,
      material: form.material.trim(),
      photoSize: form.photoSize.trim(),
      modelParams: form.modelParams.trim(),
      garmentMeasures: form.garmentMeasures,
      sizeOptions: form.sizeOptions,
      lengthOptions: form.lengthOptions,
      materialOptions: form.materialOptions,
      description: descriptionUk,
      descriptionEn,
      // Keep legacy long_* columns in sync — one description for the shop.
      longDescription: descriptionUk,
      longDescriptionEn: descriptionEn,
      shortDescription: null,
      sortOrder: (() => {
        const n = Number(form.sortOrder);
        return Number.isFinite(n) ? Math.max(0, Math.round(n)) : undefined;
      })(),
      inStock: form.inStock,
      madeToOrder: form.madeToOrder,
      season: categorySupportsSeasonFilter(form.category)
        ? form.season
        : null,
      isVisible: !asDraft,
      isNew: form.isNew,
      isPopular: form.isPopular,
      isSale: form.isSale || (compareAt != null && compareAt > priceNum),
      images,
      media: form.media,
      colorVariantIds,
      lookProductIds,
      swatches: swatchesFromPaletteIds(paletteSelection.ids, images[0] || ""),
    };

    setSaving(true);
    try {
      const res = await fetch(
        isEdit
          ? `/api/admin/products/${encodeURIComponent(productId as string)}`
          : "/api/admin/products",
        {
          method: isEdit ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.error === "name_required"
            ? "Вкажіть назву товару"
            : `HTTP ${res.status}`
        );
      }
      set("isDraft", asDraft);
      rememberFromProduct({
        material: form.material.trim(),
        materialOptions: form.materialOptions,
        photoSize: form.photoSize.trim(),
        modelParams: form.modelParams.trim(),
      });
      setFabricSuggestions(loadFabricNameSuggestions());
      setCompositionSuggestions(loadCompositionSuggestions());
      clearCachedData(CACHE_KEYS.PRODUCTS);
      router.push(getAdminProductsListHref());
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error && !err.message.startsWith("HTTP")
          ? err.message
          : "Не вдалося зберегти товар"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveProduct();
  }

  async function handleDuplicate() {
    if (!productId) return;
    setDuplicating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}/duplicate`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const copy = (await res.json()) as Product;
      router.push(`/admin/products/${encodeURIComponent(copy.id)}/edit`);
      router.refresh();
    } catch (e) {
      console.error(e);
      setError("Не вдалося скопіювати товар");
    } finally {
      setDuplicating(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-panel px-5 py-8 text-sm text-gray-500">
        Завантаження…
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="admin-form-stack admin-product-form"
      data-tour="tour-product-form"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div
        className={`admin-publish-bar ${form.isDraft ? "is-draft" : "is-live"}`}
      >
        <div className="admin-publish-bar-main">
          <div
            className="admin-publish-switch"
            role="group"
            aria-label="Статус публікації"
          >
            <button
              type="button"
              className={`admin-publish-switch-btn ${form.isDraft ? "is-active" : ""}`}
              onClick={() => set("isDraft", true)}
              aria-pressed={form.isDraft}
            >
              Чернетка
            </button>
            <button
              type="button"
              className={`admin-publish-switch-btn ${!form.isDraft ? "is-active is-live" : ""}`}
              onClick={() => set("isDraft", false)}
              aria-pressed={!form.isDraft}
            >
              На сайті
            </button>
          </div>
          <p className="admin-publish-hint">
            {form.isDraft
              ? "Приховано з магазину — зручно, коли фото й ціну заповнюють різні люди."
              : "Товар видно в каталозі після збереження."}
          </p>
        </div>
        {isEdit ? (
          <button
            type="button"
            onClick={() => void handleDuplicate()}
            disabled={duplicating || saving}
            className="admin-btn-ghost shrink-0 !h-9"
          >
            {duplicating ? "Копіювання…" : "Копія"}
          </button>
        ) : null}
      </div>

      <AdminSectionNav sections={[...PRODUCT_FORM_SECTIONS]} />

      {/* Name bilingual */}
      <ComponentCard title="Назва" sectionId="section-name">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="nameUk">Українською *</Label>
              <TranslateBtn
                busy={translating === "name-en"}
                onClick={() =>
                  void runTranslate(
                    "name-en",
                    form.nameUk,
                    "uk",
                    "en",
                    (t) => set("nameEn", t)
                  )
                }
              />
            </div>
            <Input
              id="nameUk"
              value={form.nameUk}
              onChange={(e) => set("nameUk", e.target.value)}
              placeholder="Сукня з сітки"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="nameEn">English</Label>
              <TranslateBtn
                busy={translating === "name-uk"}
                onClick={() =>
                  void runTranslate(
                    "name-uk",
                    form.nameEn,
                    "en",
                    "uk",
                    (t) => set("nameUk", t)
                  )
                }
              />
            </div>
            <Input
              id="nameEn"
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
              placeholder="Mesh dress"
            />
          </div>
        </div>
        {isEdit && (
          <p className="text-xs text-gray-400">
            Slug: <code>{form.id}</code>
          </p>
        )}
      </ComponentCard>

      {/* Price */}
      <ComponentCard title="Ціна" sectionId="section-price">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="priceUah">Ціна, ₴ *</Label>
            <Input
              id="priceUah"
              type="number"
              min="0"
              step={1}
              value={form.priceUah}
              onChange={(e) => set("priceUah", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="priceEur">Ціна, €</Label>
            <Input
              id="priceEur"
              type="number"
              min="0"
              step={1}
              value={form.priceEur}
              onChange={(e) => {
                setEurManual(true);
                set("priceEur", e.target.value);
              }}
            />
            <p className="mt-1 text-xs text-gray-400">
              {eurManual
                ? "Вказано вручну"
                : `Авто з курсу ~${UAH_PER_EUR} ₴/€`}
            </p>
          </div>
          <div>
            <Label htmlFor="priceUsd">Ціна, $</Label>
            <Input
              id="priceUsd"
              type="number"
              min="0"
              step={1}
              value={form.priceUsd}
              onChange={(e) => set("priceUsd", e.target.value)}
              placeholder="Необовʼязково"
            />
          </div>
          <div>
            <Label htmlFor="compareAt">Стара ціна, ₴ (знижка)</Label>
            <Input
              id="compareAt"
              type="number"
              min="0"
              step={1}
              value={form.compareAtUah}
              onChange={(e) => {
                set("compareAtUah", e.target.value);
                if (e.target.value.trim()) set("isSale", true);
              }}
              placeholder="Необовʼязково"
            />
          </div>
        </div>
      </ComponentCard>

      {/* Category + flags */}
      <ComponentCard title="Категорія та мітки" sectionId="section-category">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label>Категорія</Label>
              <Select
                options={categoryOptions}
                placeholder="Оберіть категорію"
                value={form.category}
                onChange={(v) => {
                  setForm((prev) => ({
                    ...prev,
                    category: v,
                    season: categorySupportsSeasonFilter(v)
                      ? prev.season
                      : null,
                  }));
                }}
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Пріоритет у каталозі</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                step={1}
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
                placeholder={isEdit ? "0" : "Авто (в кінець)"}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 md:pt-1">
            <div className="admin-toggle-row">
              <ToggleSwitch
                label="В наявності"
                enabled={form.inStock}
                setEnabled={(v) => {
                  if (v) {
                    setForm((prev) => ({
                      ...prev,
                      inStock: true,
                      madeToOrder: false,
                    }));
                  } else {
                    set("inStock", false);
                  }
                }}
              />
              <ToggleSwitch
                label="Зшиємо за 14 днів"
                enabled={form.madeToOrder}
                setEnabled={(v) => {
                  if (v) {
                    setForm((prev) => ({
                      ...prev,
                      madeToOrder: true,
                      inStock: false,
                    }));
                  } else {
                    set("madeToOrder", false);
                  }
                }}
              />
            </div>
            <div className="admin-toggle-row">
              <ToggleSwitch
                label="New"
                enabled={form.isNew}
                setEnabled={(v) => set("isNew", v)}
              />
              <ToggleSwitch
                label="Sale"
                enabled={form.isSale}
                setEnabled={(v) => set("isSale", v)}
              />
              <ToggleSwitch
                label="Популярні"
                enabled={form.isPopular}
                setEnabled={(v) => set("isPopular", v)}
              />
            </div>
            {categorySupportsSeasonFilter(form.category) ? (
              <div className="admin-toggle-row">
                <ToggleSwitch
                  label="Літо"
                  enabled={form.season === "summer"}
                  setEnabled={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      season: v ? "summer" : null,
                    }))
                  }
                />
                <ToggleSwitch
                  label="Зима"
                  enabled={form.season === "winter"}
                  setEnabled={(v) =>
                    setForm((prev) => ({
                      ...prev,
                      season: v ? "winter" : null,
                    }))
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </ComponentCard>

      {/* Color */}
      <ComponentCard title="Колір" sectionId="section-color">
        <ColorPalettePicker
          selection={paletteSelection}
          onChange={setPaletteSelection}
        />
      </ComponentCard>

      {/* Sizes */}
      <ComponentCard title="Розміри" sectionId="section-sizes">
        <AdminChipField
          label="Розміри в наявності"
          placeholderChip="Свій розмір"
          bulkPlaceholder="XXS, XS, S, M, L, XL"
          suggestions={Array.from(
            new Set([...ADMIN_SIZE_PRESETS, ...form.sizeOptions])
          )}
          selected={form.sizeOptions}
          onToggle={(value) => toggleOption("sizeOptions", value)}
          onBulkAdd={(values) => {
            setForm((prev) => ({
              ...prev,
              sizeOptions: Array.from(new Set([...prev.sizeOptions, ...values])),
            }));
          }}
        />
      </ComponentCard>

      {/* Length + material variants */}
      <ComponentCard title="Варіації" sectionId="section-variants">
        <div className="space-y-6">
          <div>
            <Label>Довжина</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(
                new Set([...PRESET_LENGTHS, ...form.lengthOptions])
              ).map((value) => {
                const active = form.lengthOptions.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleOption("lengthOptions", value)}
                    className={`admin-chip ${active ? "admin-chip-active" : ""}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex max-w-md items-center gap-2">
              <Input
                value={customLength}
                onChange={(e) => setCustomLength(e.target.value)}
                placeholder="Своя довжина, напр. 7/8"
              />
              <button
                type="button"
                onClick={() =>
                  addCustomParts("lengthOptions", customLength, () =>
                    setCustomLength("")
                  )
                }
                className="admin-btn-secondary shrink-0"
              >
                Додати
              </button>
            </div>
          </div>

          <AdminChipField
            label="Тканини"
            placeholderChip="Нова тканина"
            bulkPlaceholder="Шовк, Креп, Трикотаж"
            suggestions={Array.from(
              new Set([
                ...PRESET_FABRIC_NAMES,
                ...fabricSuggestions,
                ...form.materialOptions,
              ])
            )}
            selected={form.materialOptions}
            chipMode="add"
            onToggle={(value) => {
              setForm((prev) => {
                const has = prev.materialOptions.includes(value);
                const next = has
                  ? prev.materialOptions
                  : [...prev.materialOptions, value];
                return {
                  ...prev,
                  materialOptions: [
                    value,
                    ...next.filter((x) => x !== value),
                  ],
                };
              });
            }}
            onBulkAdd={(values) => {
              const next = rememberFabricNames(values);
              setFabricSuggestions(next);
              setForm((prev) => ({
                ...prev,
                materialOptions: Array.from(
                  new Set([...prev.materialOptions, ...values])
                ),
              }));
            }}
          />
        </div>
      </ComponentCard>

      {/* Composition + model */}
      <ComponentCard title="Склад і модель" sectionId="section-material">
        <div className="space-y-8">
          <div className="space-y-3">
            <AdminChipField
              label="Збережені склади"
              placeholderChip="Новий склад"
              bulkPlaceholder={"95% бавовна, 5% еластан"}
              suggestions={Array.from(
                new Set([
                  ...compositionSuggestions,
                  ...(form.material.trim() ? [form.material.trim()] : []),
                ])
              )}
              selected={[]}
              singleSelect
              activeValue={form.material.trim()}
              onToggle={() => {}}
              onSingleSelect={(value) => set("material", value)}
              onBulkAdd={(values) => {
                const next = rememberCompositions(values);
                setCompositionSuggestions(next);
                if (!form.material.trim() && values[0]) {
                  set("material", values[0]);
                }
              }}
            />
            <div>
              <Label htmlFor="material">Склад (текст на сайті)</Label>
              <Input
                id="material"
                value={form.material}
                onChange={(e) => set("material", e.target.value)}
                placeholder="100% поліестер / 95% cotton, 5% elastane"
              />
            </div>
          </div>
          <ModelPresetPicker
            photoSize={form.photoSize}
            modelParams={form.modelParams}
            onChange={({ photoSize, modelParams }) =>
              setForm((prev) => ({ ...prev, photoSize, modelParams }))
            }
          />
          <div className="space-y-3">
            <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
              Фактичні заміри виробу
            </p>
            <p className="text-[12px] text-gray-500">
              Порожні поля на сайті не показуються. Для старих товарів блок
              зʼявиться лише після заповнення.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {GARMENT_MEASURE_FIELDS.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={`gm-${field.key}`}>{field.label}</Label>
                  <Input
                    id={`gm-${field.key}`}
                    value={form.garmentMeasures[field.key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        garmentMeasures: {
                          ...prev.garmentMeasures,
                          [field.key]: e.target.value,
                        },
                      }))
                    }
                    placeholder="см"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* Description */}
      <ComponentCard title="Опис" sectionId="section-description">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>Українською</Label>
              <TranslateBtn
                busy={translating === "desc-en"}
                onClick={() =>
                  void runTranslate(
                    "desc-en",
                    form.descriptionUk,
                    "uk",
                    "en",
                    (t) => set("descriptionEn", t)
                  )
                }
              />
            </div>
            <TextArea
              rows={5}
              value={form.descriptionUk}
              onChange={(v) => set("descriptionUk", v)}
              placeholder="Опис товару"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>English</Label>
              <TranslateBtn
                busy={translating === "desc-uk"}
                onClick={() =>
                  void runTranslate(
                    "desc-uk",
                    form.descriptionEn,
                    "en",
                    "uk",
                    (t) => set("descriptionUk", t)
                  )
                }
              />
            </div>
            <TextArea
              rows={5}
              value={form.descriptionEn}
              onChange={(v) => set("descriptionEn", v)}
              placeholder="Product description"
            />
          </div>
        </div>
      </ComponentCard>

      {/* Media */}
      <ComponentCard title="Медіа" sectionId="section-media">
        <ProductMediaManager
          media={form.media}
          onChange={(media) => set("media", media)}
        />
      </ComponentCard>

      {/* Relations */}
      <ComponentCard title="Звʼязки" sectionId="section-links">
        <div className="space-y-8">
          <ProductRelationPicker
            kind="color-siblings"
            label="Інші кольори моделі"
            catalog={catalog}
            excludeId={productId}
            currentProductName={form.nameUk}
            selectedIds={colorVariantIds}
            onChange={setColorVariantIds}
            emptyHint="Пошуком додайте копії цієї моделі"
          />
          <div className="border-t border-gray-100 dark:border-white/[0.06]" />
          {!isEdit ? (
            <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-[12px] leading-snug text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              Спочатку створіть товар — лук можна додати після збереження.
            </p>
          ) : null}
          <ProductRelationPicker
            kind="look"
            label="Також у цьому луці"
            catalog={catalog}
            excludeId={productId}
            currentProductName={form.nameUk}
            selectedIds={lookProductIds}
            onChange={setLookProductIds}
            emptyHint="Додайте 2–4 товари з каталогу"
          />
        </div>
      </ComponentCard>

      <div className="admin-sticky-bar admin-sticky-bar--form">
        <div
          className={`admin-sticky-status ${form.isDraft ? "is-draft" : "is-live"}`}
        >
          <span className="admin-sticky-status-dot" aria-hidden />
          <span>{form.isDraft ? "Чернетка" : "На сайті"}</span>
        </div>
        <div className="admin-sticky-actions">
          <Link
            href={getAdminProductsListHref()}
            className="admin-btn-secondary admin-sticky-cancel"
          >
            Скасувати
          </Link>
          {form.isDraft ? (
            <button
              type="button"
              disabled={saving}
              className="admin-btn-mint admin-sticky-publish"
              onClick={() => void saveProduct({ asDraft: false })}
            >
              {saving ? "…" : "Опублікувати"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="admin-btn-primary admin-sticky-save"
          >
            {saving
              ? "Збереження…"
              : form.isDraft
                ? isEdit
                  ? "Зберегти"
                  : "Створити чернетку"
                : isEdit
                  ? "Зберегти"
                  : "Створити"}
          </button>
        </div>
      </div>
    </form>
  );
}
