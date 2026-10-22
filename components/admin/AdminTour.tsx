"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ADMIN_TOUR_STEPS,
  type AdminTourStep,
  type TourPlacement,
} from "@/lib/admin/tour-steps";

const SPOTLIGHT_PADDING = 10;
const TOOLTIP_GAP = 14;
const DEFAULT_PATH = "/admin";
const ACCENT = "#111111";
const ACCENT_SOFT = "rgba(17, 17, 17, 0.06)";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function findVisibleTourTarget(targetId: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(
    `[data-tour="${targetId}"]`
  );
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") continue;
    return node;
  }
  return nodes[0] ?? null;
}

function measureTarget(targetId?: string): Rect | null {
  if (!targetId) return null;
  const el = findVisibleTourTarget(targetId);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };
}

function tooltipPosition(
  target: Rect | null,
  placement: TourPlacement,
  tooltipSize: { width: number; height: number }
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;
  const w = tooltipSize.width;
  const h = tooltipSize.height;

  if (!target || placement === "center") {
    return {
      top: Math.max(margin, (vh - h) / 2),
      left: Math.max(margin, (vw - w) / 2),
    };
  }

  let top = target.top + target.height + TOOLTIP_GAP;
  let left = target.left + target.width / 2 - w / 2;

  if (placement === "top") {
    top = target.top - h - TOOLTIP_GAP;
  } else if (placement === "left") {
    top = target.top + target.height / 2 - h / 2;
    left = target.left - w - TOOLTIP_GAP;
  } else if (placement === "right") {
    top = target.top + target.height / 2 - h / 2;
    left = target.left + target.width + TOOLTIP_GAP;
  }

  top = Math.min(Math.max(margin, top), vh - h - margin);
  left = Math.min(Math.max(margin, left), vw - w - margin);
  return { top, left };
}

async function waitForTarget(
  targetId: string,
  timeoutMs = 3500
): Promise<boolean> {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      if (findVisibleTourTarget(targetId)) {
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

type Props = {
  onComplete: () => void;
  onSkip?: () => void;
};

export function AdminTour({ onComplete, onSkip }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [stepReady, setStepReady] = useState(false);

  const steps = ADMIN_TOUR_STEPS;
  const step: AdminTourStep = steps[stepIndex];
  const stepPath = step.path ?? DEFAULT_PATH;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const placement = step.placement ?? (step.target ? "bottom" : "center");
  const progressPct = ((stepIndex + 1) / steps.length) * 100;

  const refreshGeometry = useCallback(() => {
    const targetId = step.target;
    if (targetId) {
      const el = findVisibleTourTarget(targetId);
      el?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }

    window.requestAnimationFrame(() => {
      const rect = measureTarget(targetId);
      setTargetRect(rect);

      const tooltipEl = document.getElementById("admin-tour-tooltip");
      const size = tooltipEl
        ? { width: tooltipEl.offsetWidth, height: tooltipEl.offsetHeight }
        : { width: 400, height: 320 };
      setTooltipPos(tooltipPosition(rect, placement, size));
    });
  }, [step.target, placement]);

  useEffect(() => {
    const id = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (pathname === stepPath) return;
    router.push(stepPath);
  }, [pathname, router, stepPath]);

  useEffect(() => {
    let cancelled = false;
    const prepareId = window.setTimeout(() => {
      void (async () => {
        setStepReady(false);
        setTargetRect(null);

        if (pathname !== stepPath) return;

        await new Promise((r) => setTimeout(r, 280));
        if (cancelled) return;

        if (step.target) {
          await waitForTarget(step.target);
        }
        if (cancelled) return;
        setStepReady(true);
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(prepareId);
    };
  }, [pathname, stepPath, step.target, stepIndex]);

  useLayoutEffect(() => {
    if (!stepReady) return;
    refreshGeometry();
    const onResize = () => refreshGeometry();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [refreshGeometry, stepReady, stepIndex]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const goNext = useCallback(() => {
    if (isLast) onComplete();
    else setStepIndex((i) => i + 1);
  }, [isLast, onComplete]);

  const goBack = useCallback(() => setStepIndex((i) => Math.max(0, i - 1)), []);

  const handleSkip = useCallback(() => {
    if (onSkip) onSkip();
    else onComplete();
  }, [onComplete, onSkip]);

  useEffect(() => {
    if (!stepReady) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === "ArrowLeft" && !isFirst) {
        e.preventDefault();
        goBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepReady, goNext, goBack, handleSkip, isFirst]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-tour-title"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-hidden
      />

      {stepReady && targetRect ? (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-[#111] ring-offset-2 ring-offset-transparent transition-all duration-300 dark:ring-[#B7E1DF]"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            boxShadow: "0 0 0 9999px rgba(10, 12, 14, 0.62)",
          }}
        />
      ) : null}

      <div
        id="admin-tour-tooltip"
        className={`absolute flex max-h-[min(85vh,560px)] w-[min(100vw-24px,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-black/20 transition-opacity duration-200 dark:border-gray-700 dark:bg-gray-900 ${
          !stepReady ? "pointer-events-none opacity-0" : ""
        }`}
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full bg-[#111] transition-all duration-300 dark:bg-[#B7E1DF]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-bold tracking-wide text-[#111] uppercase dark:text-[#B7E1DF]">
                Крок {stepIndex + 1} з {steps.length}
              </span>
              {step.section ? (
                <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                  {step.section}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200"
              aria-label="Закрити тур"
            >
              Esc
            </button>
          </div>

          <h2
            id="admin-tour-title"
            className="text-[18px] leading-snug font-bold tracking-tight text-gray-900 dark:text-white"
          >
            {step.title}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
            {step.description}
          </p>

          {step.action ? (
            <p
              className="mt-3 rounded-xl border border-black/10 px-3.5 py-2.5 text-[12.5px] leading-snug font-semibold text-[#111] dark:border-[#B7E1DF]/25 dark:text-[#B7E1DF]"
              style={{ background: ACCENT_SOFT }}
            >
              <span
                className="mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide !text-white uppercase dark:!text-gray-900"
                style={{ background: ACCENT }}
              >
                Зробіть
              </span>
              {step.action}
            </p>
          ) : null}

          {step.tips && step.tips.length > 0 ? (
            <div className="mt-3 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-white/[0.04]">
              <p className="mb-2 text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                Поради
              </p>
              <ul className="space-y-2">
                {step.tips.map((tip, tipIndex) => (
                  <li
                    key={tip}
                    className="flex gap-2.5 text-[12px] leading-relaxed text-gray-800/85 dark:text-gray-200/90"
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#B7E1DF]/55 text-[10px] font-bold text-[#111] dark:bg-[#B7E1DF]/20 dark:text-[#B7E1DF]"
                      aria-hidden
                    >
                      {tipIndex + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-gray-900">
          <div className="flex gap-2">
            {!isFirst ? (
              <button
                type="button"
                onClick={goBack}
                disabled={!stepReady}
                className="admin-btn-secondary flex-1"
              >
                Назад
              </button>
            ) : null}
            <button
              type="button"
              onClick={goNext}
              disabled={!stepReady}
              className="admin-btn-primary flex-[1.4]"
            >
              {isLast ? "Почати роботу" : "Далі"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="mt-2.5 w-full rounded-xl py-2 text-[13px] font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Досліджуватиму сам
          </button>

          <p className="mt-2 text-center text-[10px] text-gray-400">
            ← → або Enter — навігація · Esc — вийти
          </p>

          <div className="mt-3 flex justify-center gap-1">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Перейти до кроку ${i + 1}: ${s.title}`}
                disabled={!stepReady}
                onClick={() => setStepIndex(i)}
                className={`h-1.5 rounded-full transition-all disabled:opacity-50 ${
                  i === stepIndex
                    ? "w-5 bg-[#111] dark:bg-[#B7E1DF]"
                    : i < stepIndex
                      ? "w-1.5 bg-[#111]/35 hover:bg-[#111]/55 dark:bg-[#B7E1DF]/40"
                      : "w-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
