"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  DEFAULT_MEDIA_ADJUST,
  type MediaAdjust,
  mediaAdjustCssFilter,
} from "@/lib/mediaAdjust";
import {
  findMatchingPresetId,
  MEDIA_FILTER_GROUPS,
  presetAdjust,
  savedToFilterPreset,
  type MediaFilterPreset,
} from "@/lib/mediaFilterPresets";
import {
  addSavedMediaPreset,
  loadSavedMediaPresets,
  rememberLastMediaPresetId,
  removeSavedMediaPreset,
  type SavedMediaPreset,
} from "@/lib/mediaAdjustPresetsStorage";
import { renderAdjustedImageBlob } from "@/lib/renderAdjustedImage";

export type MediaEditSession = {
  replaceUrl: string | null;
  mode: "image" | "video";
  file: File | null;
  previewUrl: string;
  naturalW: number;
  naturalH: number;
  initialAdjust?: MediaAdjust;
};

type EditorTab = "filters" | "fine" | "crop";

type Props = {
  session: MediaEditSession | null;
  queueIndex?: number;
  queueTotal?: number;
  busy?: boolean;
  onClose: () => void;
  onSkip?: () => void;
  onSaveImage: (
    file: File,
    replaceUrl: string | null,
    adjust: MediaAdjust
  ) => Promise<void>;
  onSaveVideo: (replaceUrl: string, adjust: MediaAdjust) => Promise<void>;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type PanState = { x: number; y: number };

const FINE_SLIDERS: {
  key: keyof MediaAdjust;
  label: string;
  hint: string;
  min: number;
  max: number;
}[] = [
  { key: "brightness", label: "Світло", hint: "Експозиція", min: -100, max: 100 },
  { key: "contrast", label: "Контраст", hint: "Глибина", min: -100, max: 100 },
  {
    key: "warmth",
    label: "Температура",
    hint: "Холодніше ← → Тепліше",
    min: -100,
    max: 100,
  },
  { key: "saturation", label: "Насиченість", hint: "Колір", min: -100, max: 100 },
  { key: "sharpness", label: "Різкість", hint: "Деталі", min: 0, max: 100 },
];

function presetLabel(id: string, saved: SavedMediaPreset[]): string | null {
  if (id === "custom" || id === "original") return null;
  const sid = id.startsWith("saved:") ? id.slice(6) : null;
  if (sid) return saved.find((p) => p.id === sid)?.name ?? null;
  for (const g of MEDIA_FILTER_GROUPS) {
    const p = g.presets.find((x) => x.id === id);
    if (p) return p.label;
  }
  return null;
}

function FilterPresetCard({
  preset,
  active,
  previewUrl,
  isVideo,
  onPick,
  onDelete,
}: {
  preset: MediaFilterPreset;
  active: boolean;
  previewUrl: string;
  isVideo: boolean;
  onPick: () => void;
  onDelete?: () => void;
}) {
  const thumbFilter = mediaAdjustCssFilter(preset.adjust);
  return (
    <div className="media-editor-filter-card-wrap">
      <button
        type="button"
        className={`media-editor-filter-card${
          active ? " is-active" : ""
        }${preset.isUser ? " is-user" : ""}`}
        onClick={onPick}
      >
        <span className="media-editor-filter-thumb">
          {!isVideo && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              style={thumbFilter ? { filter: thumbFilter } : undefined}
            />
          ) : (
            <span
              className="media-editor-filter-fallback"
              style={{ background: preset.accent }}
            />
          )}
          {preset.isUser ? (
            <span className="media-editor-filter-star" aria-hidden="true">
              ★
            </span>
          ) : null}
        </span>
        <span className="media-editor-filter-name">{preset.label}</span>
        {preset.tag ? (
          <span className="media-editor-filter-tag">{preset.tag}</span>
        ) : null}
      </button>
      {onDelete ? (
        <button
          type="button"
          className="media-editor-filter-delete"
          aria-label={`Видалити ${preset.label}`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export default function MediaEditModal({
  session,
  queueIndex = 0,
  queueTotal = 0,
  busy = false,
  onClose,
  onSkip,
  onSaveImage,
  onSaveVideo,
}: Props) {
  const [adjust, setAdjust] = useState<MediaAdjust>(DEFAULT_MEDIA_ADJUST);
  const [activePreset, setActivePreset] = useState<string>("original");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<EditorTab>("filters");
  const [compare, setCompare] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedMediaPreset[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    setSavedPresets(loadSavedMediaPresets());
  }, [session]);

  const frameRef = useRef<HTMLDivElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);
  const panRef = useRef<PanState>({ x: 0, y: 0 });
  const cropReadyRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const rafRef = useRef(0);

  useScrollLock(Boolean(session));

  useEffect(() => {
    if (!session) return;
    const initial = session.initialAdjust ?? DEFAULT_MEDIA_ADJUST;
    setAdjust(initial);
    setActivePreset(findMatchingPresetId(initial, loadSavedMediaPresets()) ?? "custom");
    setTab("filters");
    setCompare(false);
    setSaveName("");
    setSaveNotice(null);
    cropReadyRef.current = false;
    panRef.current = { x: 0, y: 0 };
  }, [session]);

  const applyPanToDom = useCallback(() => {
    const img = cropImgRef.current;
    if (!img) return;
    img.style.transform = `translate3d(${panRef.current.x}px, ${panRef.current.y}px, 0)`;
  }, []);

  const coverLayout = useCallback((naturalW: number, naturalH: number) => {
    const frame = frameRef.current;
    if (!frame) return null;
    const frameW = frame.clientWidth;
    const frameH = frame.clientHeight;
    if (frameW <= 0 || frameH <= 0) return null;
    const scale = Math.max(frameW / naturalW, frameH / naturalH);
    const dispW = naturalW * scale;
    const dispH = naturalH * scale;
    const minX = frameW - dispW;
    const minY = frameH - dispH;
    return { frameW, frameH, scale, dispW, dispH, minX, minY };
  }, []);

  const centerPan = useCallback(
    (naturalW: number, naturalH: number) => {
      const layout = coverLayout(naturalW, naturalH);
      if (!layout) {
        panRef.current = { x: 0, y: 0 };
        return;
      }
      panRef.current = {
        x: (layout.frameW - layout.dispW) / 2,
        y: (layout.frameH - layout.dispH) / 2,
      };
      applyPanToDom();
      const img = cropImgRef.current;
      if (img) {
        img.style.width = `${layout.dispW}px`;
        img.style.height = `${layout.dispH}px`;
      }
      cropReadyRef.current = true;
    },
    [applyPanToDom, coverLayout]
  );

  useEffect(() => {
    if (!session || session.mode !== "image") return;
    const img = cropImgRef.current;
    if (img?.complete && img.naturalWidth) {
      centerPan(session.naturalW, session.naturalH);
    }
  }, [session, centerPan, tab]);

  const getCropRect = useCallback(() => {
    if (!session || session.mode !== "image") {
      return { x: 0, y: 0, w: 1, h: 1 };
    }
    const layout = coverLayout(session.naturalW, session.naturalH);
    if (!layout) return { x: 0, y: 0, w: 1, h: 1 };
    const { naturalW, naturalH } = session;
    const { scale, frameW, frameH } = layout;
    const { x: panX, y: panY } = panRef.current;
    const srcX = -panX / scale;
    const srcY = -panY / scale;
    const srcW = frameW / scale;
    const srcH = frameH / scale;
    const crop = {
      x: clamp(srcX / naturalW, 0, 1),
      y: clamp(srcY / naturalH, 0, 1),
      w: clamp(srcW / naturalW, 0.01, 1),
      h: clamp(srcH / naturalH, 0.01, 1),
    };
    if (crop.x + crop.w > 1) crop.x = Math.max(0, 1 - crop.w);
    if (crop.y + crop.h > 1) crop.y = Math.max(0, 1 - crop.h);
    return crop;
  }, [coverLayout, session]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!session || session.mode !== "image" || tab !== "crop") return;
    e.preventDefault();
    frameRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: panRef.current.x,
      originY: panRef.current.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !session) return;
    if (session.mode !== "image" || tab !== "crop") return;
    e.preventDefault();
    const layout = coverLayout(session.naturalW, session.naturalH);
    if (!layout) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    panRef.current = {
      x: clamp(drag.originX + dx, layout.minX, 0),
      y: clamp(drag.originY + dy, layout.minY, 0),
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(applyPanToDom);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  };

  const previewAdjust = compare ? DEFAULT_MEDIA_ADJUST : adjust;
  const previewFilter = mediaAdjustCssFilter(previewAdjust);

  function pickPreset(id: string) {
    setActivePreset(id);
    setAdjust(presetAdjust(id, savedPresets));
    rememberLastMediaPresetId(id);
    setSaveNotice(null);
  }

  function onFineChange(key: keyof MediaAdjust, value: number) {
    setAdjust((prev) => ({ ...prev, [key]: value }));
    setActivePreset("custom");
    setSaveNotice(null);
  }

  function handleSaveTemplate() {
    const name = saveName.trim();
    if (!name) {
      setSaveNotice("Введіть назву заготовки");
      return;
    }
    const next = addSavedMediaPreset(name, adjust);
    setSavedPresets(next);
    const created = next[0];
    if (created) {
      const fid = `saved:${created.id}`;
      setActivePreset(fid);
      rememberLastMediaPresetId(fid);
    }
    setSaveName("");
    setSaveNotice("Заготовку збережено");
  }

  function handleDeleteSaved(id: string) {
    const next = removeSavedMediaPreset(id);
    setSavedPresets(next);
    if (activePreset === `saved:${id}`) {
      pickPreset("original");
    }
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      if (session.mode === "video") {
        if (!session.replaceUrl) return;
        await onSaveVideo(session.replaceUrl, adjust);
        return;
      }
      const img = cropImgRef.current;
      if (!img || !session.file) return;
      if (!cropReadyRef.current) {
        centerPan(session.naturalW, session.naturalH);
      }
      const crop = getCropRect();
      const blob = await renderAdjustedImageBlob(
        img,
        session.naturalW,
        session.naturalH,
        crop,
        adjust
      );
      const file = new File([blob], "catalog.webp", { type: "image/webp" });
      await onSaveImage(file, session.replaceUrl, adjust);
    } finally {
      setSaving(false);
    }
  }

  if (!session) return null;

  const isVideo = session.mode === "video";
  const disabled = saving || busy;
  const showCropLayer = !isVideo && tab === "crop";
  const showFilteredPreview = !showCropLayer;

  const tabs: { id: EditorTab; label: string; hide?: boolean }[] = [
    { id: "filters", label: "Фільтри" },
    { id: "fine", label: "Точно" },
    { id: "crop", label: "Кадр 3:5", hide: isVideo },
  ];

  const activeLabel = presetLabel(activePreset, savedPresets);

  return (
    <div className="media-editor-root" role="presentation">
      <button
        type="button"
        className="media-editor-backdrop"
        aria-label="Закрити"
        onClick={onClose}
      />
      <div
        className="media-editor-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-editor-title"
        data-scroll-lock-allow
      >
        <header className="media-editor-head">
          <div>
            <p className="media-editor-eyebrow">
              {isVideo ? "Відео" : "Фото"}
              {queueTotal > 1 ? ` · ${queueIndex} з ${queueTotal}` : ""}
            </p>
            <h2 id="media-editor-title" className="media-editor-title">
              Редактор медіа
            </h2>
          </div>
          <button
            type="button"
            className="media-editor-close"
            aria-label="Закрити"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="media-editor-layout">
          <div className="media-editor-preview-wrap">
            <div
              ref={frameRef}
              className="media-editor-frame"
              style={{
                cursor: showCropLayer ? "grab" : "default",
                touchAction: "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {isVideo ? (
                <video
                  src={session.previewUrl}
                  className="media-editor-media"
                  style={
                    previewFilter ? { filter: previewFilter } : undefined
                  }
                  muted
                  playsInline
                  loop
                  autoPlay
                />
              ) : (
                <>
                  {showFilteredPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.previewUrl}
                      alt=""
                      className="media-editor-media"
                      draggable={false}
                      style={
                        previewFilter ? { filter: previewFilter } : undefined
                      }
                    />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={cropImgRef}
                    src={session.previewUrl}
                    alt=""
                    draggable={false}
                    className={`media-editor-crop-layer${
                      showCropLayer ? " is-visible" : ""
                    }`}
                    onLoad={() =>
                      centerPan(session.naturalW, session.naturalH)
                    }
                  />
                </>
              )}
              <div className="media-editor-frame-guide" aria-hidden="true" />
              <span className="media-editor-frame-ratio">3 : 5</span>
            </div>

            <div className="media-editor-preview-actions">
              <button
                type="button"
                className={`media-editor-chip${compare ? " is-active" : ""}`}
                onPointerDown={() => setCompare(true)}
                onPointerUp={() => setCompare(false)}
                onPointerLeave={() => setCompare(false)}
                onPointerCancel={() => setCompare(false)}
              >
                Утримуй — до / після
              </button>
              {activeLabel && (
                <span className="media-editor-active-filter">{activeLabel}</span>
              )}
              {activePreset === "custom" && (
                <span className="media-editor-active-filter">Власне</span>
              )}
            </div>
          </div>

          <div className="media-editor-side">
            <nav className="media-editor-tabs" aria-label="Режим">
              {tabs
                .filter((t) => !t.hide)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`media-editor-tab${
                      tab === t.id ? " is-active" : ""
                    }`}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
            </nav>

            <div className="media-editor-scroll">
              {tab === "filters" && (
                <div className="media-editor-filters">
                  <div className="media-editor-save-preset">
                    <p className="media-editor-save-title">
                      Зберегти поточні налаштування
                    </p>
                    <div className="media-editor-save-row">
                      <input
                        type="text"
                        className="admin-input media-editor-save-input"
                        placeholder="Назва, напр. «Лук вітрина»"
                        value={saveName}
                        maxLength={48}
                        onChange={(e) => {
                          setSaveName(e.target.value);
                          setSaveNotice(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTemplate();
                        }}
                      />
                      <button
                        type="button"
                        className="admin-btn-secondary media-editor-save-btn"
                        onClick={handleSaveTemplate}
                      >
                        Зберегти
                      </button>
                    </div>
                    {saveNotice ? (
                      <p
                        className={`media-editor-save-notice${
                          saveNotice.includes("Введіть")
                            ? " is-warn"
                            : " is-ok"
                        }`}
                      >
                        {saveNotice}
                      </p>
                    ) : null}
                  </div>

                  {savedPresets.length > 0 && (
                    <section className="media-editor-filter-section">
                      <h3 className="media-editor-filter-section-title">
                        Мої заготовки
                        <span className="media-editor-filter-count">
                          {savedPresets.length}
                        </span>
                      </h3>
                      <div className="media-editor-filter-grid media-editor-filter-grid--user">
                        {savedPresets.map((sp) => {
                          const preset = savedToFilterPreset(sp);
                          return (
                            <FilterPresetCard
                              key={preset.id}
                              preset={preset}
                              active={activePreset === preset.id}
                              previewUrl={session.previewUrl}
                              isVideo={isVideo}
                              onPick={() => pickPreset(preset.id)}
                              onDelete={() => handleDeleteSaved(sp.id)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {MEDIA_FILTER_GROUPS.map((group) => (
                    <section
                      key={group.id}
                      className="media-editor-filter-section"
                    >
                      <h3 className="media-editor-filter-section-title">
                        {group.title}
                      </h3>
                      <div className="media-editor-filter-grid">
                        {group.presets.map((preset) => (
                          <FilterPresetCard
                            key={preset.id}
                            preset={preset}
                            active={activePreset === preset.id}
                            previewUrl={session.previewUrl}
                            isVideo={isVideo}
                            onPick={() => pickPreset(preset.id)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {tab === "fine" && (
                <div className="media-editor-fine">
                  <p className="media-editor-hint">
                    Тонке налаштування — ідеально, коли фото і відео з різного
                    світла.
                  </p>
                  {FINE_SLIDERS.map(({ key, label, hint, min, max }) => (
                    <label key={key} className="media-editor-slider">
                      <div className="media-editor-slider-top">
                        <span className="media-editor-slider-label">
                          {label}
                        </span>
                        <span className="media-editor-slider-value">
                          {adjust[key]}
                        </span>
                      </div>
                      <span className="media-editor-slider-hint">{hint}</span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={adjust[key]}
                        className="media-editor-range"
                        onChange={(e) =>
                          onFineChange(key, Number(e.target.value))
                        }
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    className="media-editor-reset"
                    onClick={() => pickPreset("original")}
                  >
                    Скинути все
                  </button>
                  <div className="media-editor-fine-save">
                    <p className="media-editor-hint">
                      Сподобалось поєднання? Збережіть у «Фільтри» → заготовка
                      зʼявиться зверху.
                    </p>
                    <button
                      type="button"
                      className="admin-btn-secondary !text-xs"
                      onClick={() => setTab("filters")}
                    >
                      Зберегти заготовку…
                    </button>
                  </div>
                </div>
              )}

              {tab === "crop" && !isVideo && (
                <div className="media-editor-crop-help">
                  <p className="media-editor-hint">
                    Посуньте фото пальцем або мишею — рамка 3:5 як у каталозі.
                  </p>
                  <ul className="media-editor-crop-tips">
                    <li>Центруйте модель або виріз</li>
                    <li>Фільтри застосуються після кадру</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="media-editor-foot">
          <button
            type="button"
            className="admin-btn-ghost"
            disabled={disabled}
            onClick={onClose}
          >
            Скасувати
          </button>
          <div className="media-editor-foot-right">
            {onSkip && queueTotal > 1 ? (
              <button
                type="button"
                className="admin-btn-secondary"
                disabled={disabled}
                onClick={onSkip}
              >
                Пропустити
              </button>
            ) : null}
            <button
              type="button"
              className="admin-btn-primary media-editor-save"
              disabled={disabled}
              onClick={() => void handleSave()}
            >
              {saving ? "Збереження…" : "Застосувати"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
