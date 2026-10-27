"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/admin/ComponentCard";
import ColorPalettePicker from "@/components/admin/ColorPalettePicker";
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
  color: string;
  colorHex: string;
  material: string;
  photoSize: string;
  modelParams: string;
  sizeOptions: string[];
  lengthOptions: string[];
  materialOptions: string[];
  descriptionUk: string;
  descriptionEn: string;
  sortOrder: string;
  inStock: boolean;
  isVisible: boolean;
  isNew: boolean;
  isPopular: boolean;
  isSale: boolean;
  media: ProductMedia[];
};

const EMPTY: FormState = {
  nameUk: "",
  nameEn: "",
  id: "",
  priceUah: "",
  priceEur: "",
  priceUsd: "",
  compareAtUah: "",
  category: "",
  color: "",
  colorHex: "#111111",
  material: "",
  photoSize: "",
  modelParams: "",
  sizeOptions: ["S", "M", "L"],
  lengthOptions: [],
  materialOptions: [],
  descriptionUk: "",
  descriptionEn: "",
  sortOrder: "",
  inStock: true,
  isVisible: true,
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
          color: p.color ?? "",
          colorHex: p.colorHex || "#111111",
          material: p.material ?? "",
          photoSize: p.photoSize ?? "",
          modelParams: p.modelParams ?? "",
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
          isVisible: p.isVisible !== false,
          isNew: Boolean(p.isNew),
          isPopular: Boolean(p.isPopular),
          isSale: Boolean(p.isSale),
          media,
        });
        setEurManual(p.priceEur != null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.nameUk.trim()) {
      setError("Вкажіть назву (UK)");
      return;
    }
    const priceNum = Number(form.priceUah);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Вкажіть коректну ціну в грн");
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
      color: form.color.trim(),
      colorHex: form.colorHex.trim(),
      material: form.material.trim(),
      photoSize: form.photoSize.trim(),
      modelParams: form.modelParams.trim(),
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
      isVisible: form.isVisible,
      isNew: form.isNew,
      isPopular: form.isPopular,
      isSale: form.isSale || (compareAt != null && compareAt > priceNum),
      images,
      media: form.media,
      colorVariantIds,
      lookProductIds,
      swatches: form.color
        ? [
            {
              img: images[0] || "",
              label: form.color,
              hex: form.colorHex || undefined,
            },
          ]
        : [],
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
      className="space-y-6"
      data-tour="tour-product-form"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void handleDuplicate()}
            disabled={duplicating || saving}
            className="admin-btn-secondary"
          >
            {duplicating ? "Копіювання…" : "Копіювати товар"}
          </button>
        </div>
      )}

      {/* Name bilingual */}
      <ComponentCard title="Назва">
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
      <ComponentCard title="Ціна">
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
      <ComponentCard title="Категорія та мітки">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label>Категорія</Label>
              <Select
                options={categoryOptions}
                placeholder="Оберіть категорію"
                value={form.category}
                onChange={(v) => set("category", v)}
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
              <p className="mt-1 text-xs text-gray-400">
                Менше число — вище в каталозі. Порожнє при створенні — в кінець
                списку.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <ToggleSwitch
                label="В наявності"
                enabled={form.inStock}
                setEnabled={(v) => set("inStock", v)}
              />
              <ToggleSwitch
                label="Показувати в каталозі"
                enabled={form.isVisible}
                setEnabled={(v) => set("isVisible", v)}
              />
            </div>
            <p className="text-xs text-gray-400">
              Без наявності товар лишається на сайті, але його не можна
              замовити. Без «в каталозі» — не видно в каталозі / пошуку /
              головній (сторінка товару за прямим посиланням працює).
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
          </div>
        </div>
      </ComponentCard>

      {/* Color */}
      <ComponentCard title="Колір">
        <ColorPalettePicker
          color={form.color}
          colorHex={form.colorHex}
          onChange={({ color, colorHex }) =>
            setForm((prev) => ({ ...prev, color, colorHex }))
          }
        />
      </ComponentCard>

      {/* Sizes */}
      <ComponentCard
        title="Розміри в наявності"
        desc="Які розміри є зараз. На сайті вони підсвітяться в блоці «В наявності», якщо увімкнено «В наявності»."
      >
        <AdminChipField
          label="Розміри"
          hint="Можна вставити список одразу (кома або новий рядок). Нові назви запамʼятовуються для інших товарів."
          placeholderChip="Свій розмір, напр. 42"
          bulkPlaceholder="XXS, XS, S, M, L, XL, A, B, C, D"
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
      <ComponentCard
        title="Варіації"
        desc="Опційно. Якщо нічого не обрати — блок на сторінці товару не з’явиться."
      >
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
            label="Назви тканин (варіанти на сайті)"
            hint="Клієнт обирає одну з назв. Список можна розширити масово — значення запамʼятовуються в браузері та підтягуються з каталогу."
            placeholderChip="Нова назва тканини"
            bulkPlaceholder="Шовк, Креп, Трикотаж, Віскоза"
            suggestions={Array.from(
              new Set([
                ...PRESET_FABRIC_NAMES,
                ...fabricSuggestions,
                ...form.materialOptions,
              ])
            )}
            selected={form.materialOptions}
            onToggle={(value) => toggleOption("materialOptions", value)}
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
      <ComponentCard title="Склад і модель">
        <div className="space-y-8">
          <div className="space-y-3">
            <AdminChipField
              label="Склад — збережені варіанти"
              hint="Клік по чіпу підставляє текст у поле нижче. Нові склади запамʼятовуються після збереження товару або масового додавання."
              placeholderChip="Новий склад одним рядком"
              bulkPlaceholder={"95% бавовна, 5% еластан\n100% шовк"}
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
        </div>
      </ComponentCard>

      {/* Description */}
      <ComponentCard title="Опис">
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
      <ComponentCard title="Медіа">
        <ProductMediaManager
          media={form.media}
          onChange={(media) => set("media", media)}
        />
      </ComponentCard>

      {/* Relations */}
      <ComponentCard title="Звʼязки">
        <div className="space-y-8">
          <ProductRelationPicker
            label="Повʼязані товари (інші кольори)"
            description="Той самий виріб в інших кольорах палітри. На PDP: клік по слоту → перехід на той SKU; якщо кольору немає — «Зшиємо для вас»."
            catalog={catalog}
            excludeId={productId}
            selectedIds={colorVariantIds}
            onChange={setColorVariantIds}
            emptyHint="Додайте білу / рожеву / чорну версію цього виробу"
          />
          <div className="border-t border-gray-100 dark:border-white/[0.06]" />
          <ProductRelationPicker
            label="Також у цьому луці"
            description="Показуються в блоці «Також у цьому луці»."
            catalog={catalog}
            excludeId={productId}
            selectedIds={lookProductIds}
            onChange={setLookProductIds}
            emptyHint="Додайте товари луку"
          />
        </div>
      </ComponentCard>

      <div className="admin-sticky-bar">
        <p className="hidden text-[13px] text-gray-500 sm:block dark:text-gray-400">
          {isEdit ? "Зміни збережуться одразу після підтвердження" : "Новий товар з’явиться в каталозі після створення"}
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          <Link
            href={getAdminProductsListHref()}
            className="admin-btn-secondary"
          >
            Скасувати
          </Link>
          <button type="submit" disabled={saving} className="admin-btn-primary">
            {saving
              ? "Збереження…"
              : isEdit
                ? "Зберегти зміни"
                : "Створити товар"}
          </button>
        </div>
      </div>
    </form>
  );
}
