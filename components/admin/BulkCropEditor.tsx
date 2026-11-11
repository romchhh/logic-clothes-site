"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MediaEditModal, {
  type MediaEditSession,
} from "@/components/admin/MediaEditModal";
import {
  ADMIN_LIST_SORT_OPTIONS,
  parseAdminListSort,
  sortByNameAndDate,
  type AdminListSort,
} from "@/lib/adminListSort";
import { CACHE_KEYS, clearCachedData } from "@/lib/cache";
import type { MediaAdjust } from "@/lib/mediaAdjust";
import type { Product, ProductMedia } from "@/lib/types";

type CropJob = {
  productId: string;
  productName: string;
  url: string;
  adjust?: MediaAdjust;
};

function productImages(p: Product): ProductMedia[] {
  if (p.media?.length) {
    return p.media.filter((m) => m.type !== "video");
  }
  return (p.images || []).map((url) => ({ url, type: "image" as const }));
}

function buildJobs(list: Product[]): CropJob[] {
  const jobs: CropJob[] = [];
  for (const p of list) {
    for (const m of productImages(p)) {
      if (!m.url) continue;
      jobs.push({
        productId: p.id,
        productName: p.name,
        url: m.url,
        adjust: m.adjust,
      });
    }
  }
  return jobs;
}

export default function BulkCropEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<AdminListSort>("name-asc");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [session, setSession] = useState<MediaEditSession | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueTotal, setQueueTotal] = useState(0);

  const productsRef = useRef(products);
  productsRef.current = products;
  const queueRef = useRef<CropJob[]>([]);
  const currentJobRef = useRef<CropJob | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Product[];
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("Не вдалося завантажити товари");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const urls = objectUrlsRef.current;
    return () => {
      for (const u of urls) URL.revokeObjectURL(u);
      urls.clear();
    };
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = !q
      ? products
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q) ||
            String(p.sku ?? "").toLowerCase().includes(q)
        );
    return sortByNameAndDate(list, sort);
  }, [products, search, sort]);

  const photoCount = useMemo(
    () => buildJobs(filtered).length,
    [filtered]
  );

  const openJob = useCallback(async (job: CropJob) => {
    currentJobRef.current = job;
    try {
      const res = await fetch(job.url, { cache: "no-store" });
      if (!res.ok) throw new Error("fetch");
      const blob = await res.blob();
      const file = new File(
        [blob],
        `${job.productId}-photo.webp`,
        { type: blob.type || "image/webp" }
      );
      const objectUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(objectUrl);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("img"));
        img.src = objectUrl;
      });
      setSession({
        mode: "image",
        file,
        previewUrl: objectUrl,
        replaceUrl: job.url,
        naturalW: img.naturalWidth,
        naturalH: img.naturalHeight,
        initialAdjust: job.adjust,
        label: `${job.productName} · ${job.url.split("/").pop()}`,
      });
    } catch (e) {
      console.error(e);
      setError(`Не вдалося відкрити фото «${job.productName}»`);
      currentJobRef.current = null;
    }
  }, []);

  const closeSession = useCallback(() => {
    setSession(null);
    currentJobRef.current = null;
  }, []);

  const abortQueue = useCallback(() => {
    queueRef.current = [];
    setQueueTotal(0);
    setQueueIndex(0);
    closeSession();
  }, [closeSession]);

  const advanceQueue = useCallback(async () => {
    const next = queueRef.current.shift();
    if (!next) {
      abortQueue();
      setNotice("Кадрування завершено");
      return;
    }
    setQueueIndex((i) => i + 1);
    await openJob(next);
  }, [abortQueue, openJob]);

  const startQueue = useCallback(
    async (jobs: CropJob[], fromIndex = 0) => {
      if (!jobs.length) {
        setError("Немає фото для кадрування");
        return;
      }
      setError(null);
      setNotice(null);
      const slice = jobs.slice(fromIndex);
      queueRef.current = slice.slice(1);
      setQueueTotal(slice.length);
      setQueueIndex(1);
      await openJob(slice[0]);
    },
    [openJob]
  );

  const uploadCropped = useCallback(async (file: File) => {
    const fd = new FormData();
    fd.append("images", file);
    fd.append("fit", "catalog");
    fd.append("ready", "1");
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      throw new Error(body.message || body.error || `HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      items?: ProductMedia[];
      urls?: string[];
    };
    const fresh =
      data.items?.[0] ??
      (data.urls?.[0] ? { url: data.urls[0], type: "image" as const } : null);
    if (!fresh?.url) throw new Error("empty upload");
    return fresh;
  }, []);

  const persistProductMedia = useCallback(
    async (
      productId: string,
      replaceUrl: string,
      fresh: ProductMedia,
      adjust: MediaAdjust
    ) => {
      const product = productsRef.current.find((p) => p.id === productId);
      if (!product) throw new Error("product missing");

      const currentMedia: ProductMedia[] =
        product.media?.length
          ? product.media.map((m) => ({ ...m }))
          : (product.images || []).map((url) => ({
              url,
              type: "image" as const,
            }));

      const nextMedia = currentMedia.map((m) => {
        if (m.url !== replaceUrl) return m;
        // Tone/crop baked into the uploaded file — clear adjust so CSS
        // does not re-apply the same edits on the storefront.
        void adjust;
        return {
          ...fresh,
          type: "image" as const,
          adjust: undefined,
        };
      });
      const images = nextMedia
        .filter((m) => m.type !== "video")
        .map((m) => m.url);

      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media: nextMedia,
            images,
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = (await res.json()) as Product;
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? updated : p))
      );
      clearCachedData(CACHE_KEYS.PRODUCTS);
    },
    []
  );

  const onSaveImage = async (
    file: File,
    replaceUrl: string | null,
    adjust: MediaAdjust
  ) => {
    const job = currentJobRef.current;
    if (!job || !replaceUrl) return;
    setBusy(true);
    setError(null);
    try {
      const fresh = await uploadCropped(file);
      await persistProductMedia(job.productId, replaceUrl, fresh, adjust);
      closeSession();
      if (queueRef.current.length) {
        await advanceQueue();
      } else {
        abortQueue();
        setNotice("Збережено");
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Не вдалося зберегти кадр");
    } finally {
      setBusy(false);
    }
  };

  const onSkip = () => {
    closeSession();
    if (queueRef.current.length) void advanceQueue();
    else abortQueue();
  };

  return (
    <div className="admin-panel">
      <div className="admin-panel-head flex-wrap gap-3">
        <div>
          <h2 className="admin-panel-title">Кадр 3:5 для всіх фото</h2>
          <p className="admin-panel-desc">
            {loading
              ? "Завантаження…"
              : `${filtered.length} товарів · ${photoCount} фото`}
          </p>
        </div>
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => void load()}
            className="admin-btn-secondary !h-9 !px-3 !text-xs"
            disabled={loading || busy || Boolean(session)}
          >
            Оновити
          </button>
          <button
            type="button"
            onClick={() => void startQueue(buildJobs(filtered))}
            className="admin-btn-primary !h-9 !px-4 !text-xs"
            disabled={loading || busy || Boolean(session) || photoCount === 0}
          >
            Кадрувати всі фото
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-gray-100 px-3 py-3 dark:border-white/[0.05] sm:flex-row sm:items-center sm:px-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою або ID…"
          className="admin-input max-w-md"
          disabled={Boolean(session)}
        />
        <select
          value={sort}
          onChange={(e) => setSort(parseAdminListSort(e.target.value))}
          className="admin-input sm:w-52"
          aria-label="Сортування"
          disabled={Boolean(session)}
        >
          {ADMIN_LIST_SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="border-b border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}
      {notice && !error ? (
        <div className="border-b border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {notice}
        </div>
      ) : null}

      <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Завантаження…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-500">
            Нічого не знайдено
          </div>
        ) : (
          filtered.map((p) => {
            const imgs = productImages(p);
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 px-3 py-3.5 sm:flex-row sm:items-start sm:gap-4 sm:px-5"
              >
                <div className="min-w-0 sm:w-48 sm:shrink-0">
                  <Link
                    href={`/admin/products/${encodeURIComponent(p.id)}/edit`}
                    className="block truncate text-[14px] font-semibold text-gray-900 hover:underline dark:text-white"
                  >
                    {p.name}
                  </Link>
                  <p className="truncate text-[12px] text-gray-400">{p.id}</p>
                  <p className="mt-1 text-[12px] text-gray-500">
                    {imgs.length} фото
                  </p>
                </div>
                <div className="admin-mobile-scroll flex flex-wrap gap-2">
                  {imgs.length === 0 ? (
                    <span className="text-sm text-gray-400">Без фото</span>
                  ) : (
                    imgs.map((m, idx) => (
                      <button
                        key={`${p.id}-${m.url}-${idx}`}
                        type="button"
                        disabled={busy || Boolean(session)}
                        title="Кадрувати"
                        className="group relative h-[88px] w-[66px] shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]"
                        onClick={() => {
                          const jobs = buildJobs(filtered);
                          const start = jobs.findIndex(
                            (j) =>
                              j.productId === p.id && j.url === m.url
                          );
                          void startQueue(jobs, Math.max(0, start));
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                          Кадр
                        </span>
                      </button>
                    ))
                  )}
                </div>
                {imgs.length > 0 ? (
                  <button
                    type="button"
                    className="admin-btn-secondary !h-9 shrink-0 !px-3 !text-xs sm:ml-auto"
                    disabled={busy || Boolean(session)}
                    onClick={() => {
                      const jobs = buildJobs([p]);
                      void startQueue(jobs);
                    }}
                  >
                    Кадрувати товар
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="admin-sticky-bar sm:hidden">
        <button
          type="button"
          onClick={() => void load()}
          className="admin-btn-secondary flex-1 !h-10 !text-xs"
          disabled={loading || busy || Boolean(session)}
        >
          Оновити
        </button>
        <button
          type="button"
          onClick={() => void startQueue(buildJobs(filtered))}
          className="admin-btn-primary flex-[1.4] !h-10 !text-xs"
          disabled={loading || busy || Boolean(session) || photoCount === 0}
        >
          Кадрувати всі
        </button>
      </div>

      <MediaEditModal
        session={session}
        queueIndex={queueIndex}
        queueTotal={queueTotal}
        busy={busy}
        onClose={abortQueue}
        onSkip={onSkip}
        onSaveImage={onSaveImage}
        onSaveVideo={async () => {}}
      />
    </div>
  );
}
