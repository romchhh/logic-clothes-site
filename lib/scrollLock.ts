/**
 * Nested-safe body scroll lock for modals / lightboxes / side panels.
 * Uses position:fixed (needed for iOS) + overflow hidden on html/body.
 */

let lockCount = 0;
let savedScrollY = 0;
let savedBodyOverflow = "";
let savedBodyPaddingRight = "";
let savedBodyPosition = "";
let savedBodyTop = "";
let savedBodyLeft = "";
let savedBodyRight = "";
let savedBodyWidth = "";
let savedHtmlOverflow = "";
let savedHtmlScrollBehavior = "";
let touchBlockerAttached = false;
let restoreRaf = 0;

const SCROLLABLE_SEL =
  ".side-panel, .side-panel-body, .mobile-menu, .mobile-menu-panel, .pdp-lightbox, .pdp-lightbox-track, [data-scroll-lock-allow], [role='dialog'], .filter-body";

function isInsideScrollable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(SCROLLABLE_SEL));
}

function onTouchMove(e: TouchEvent) {
  if (lockCount <= 0) return;
  if (isInsideScrollable(e.target)) return;
  e.preventDefault();
}

function onWheel(e: WheelEvent) {
  if (lockCount <= 0) return;
  if (isInsideScrollable(e.target)) return;
  e.preventDefault();
}

function attachTouchBlocker() {
  if (touchBlockerAttached || typeof document === "undefined") return;
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  document.addEventListener("wheel", onWheel, { passive: false });
  touchBlockerAttached = true;
}

function detachTouchBlocker() {
  if (!touchBlockerAttached || typeof document === "undefined") return;
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("wheel", onWheel);
  touchBlockerAttached = false;
}

function scrollToY(y: number) {
  const top = Math.max(0, y);
  // Avoid CSS `scroll-behavior: smooth` animating from 0 → y (looks like
  // a jump to the header, then back to the previous spot).
  window.scrollTo({ top, left: 0, behavior: "instant" });
  // Fallback for older engines without `instant`
  if (Math.abs((window.scrollY || 0) - top) > 1) {
    window.scrollTo(0, top);
  }
}

function applyLock() {
  if (typeof document === "undefined") return;
  const body = document.body;
  const html = document.documentElement;

  if (restoreRaf) {
    cancelAnimationFrame(restoreRaf);
    restoreRaf = 0;
  }

  savedScrollY = window.scrollY || window.pageYOffset || 0;
  savedBodyOverflow = body.style.overflow;
  savedBodyPaddingRight = body.style.paddingRight;
  savedBodyPosition = body.style.position;
  savedBodyTop = body.style.top;
  savedBodyLeft = body.style.left;
  savedBodyRight = body.style.right;
  savedBodyWidth = body.style.width;
  savedHtmlOverflow = html.style.overflow;
  savedHtmlScrollBehavior = html.style.scrollBehavior;

  const scrollbarWidth = window.innerWidth - html.clientWidth;

  html.style.overflow = "hidden";
  html.style.scrollBehavior = "auto";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
  body.dataset.scrollLock = "1";
  attachTouchBlocker();
}

function releaseLock() {
  if (typeof document === "undefined") return;
  const body = document.body;
  const html = document.documentElement;
  const y = savedScrollY;

  html.style.overflow = savedHtmlOverflow;
  html.style.scrollBehavior = "auto";
  body.style.overflow = savedBodyOverflow;
  body.style.paddingRight = savedBodyPaddingRight;
  body.style.position = savedBodyPosition;
  body.style.top = savedBodyTop;
  body.style.left = savedBodyLeft;
  body.style.right = savedBodyRight;
  body.style.width = savedBodyWidth;
  delete body.dataset.scrollLock;

  detachTouchBlocker();
  scrollToY(y);

  // Focus returning to a header control can scrollIntoView after unlock —
  // re-assert position for a couple of frames, then restore smooth scroll.
  if (restoreRaf) cancelAnimationFrame(restoreRaf);
  restoreRaf = requestAnimationFrame(() => {
    scrollToY(y);
    restoreRaf = requestAnimationFrame(() => {
      scrollToY(y);
      html.style.scrollBehavior = savedHtmlScrollBehavior;
      restoreRaf = 0;
    });
  });
}

/** Acquire a scroll lock. Call the returned function (or releaseScrollLock) to unlock. */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  lockCount += 1;
  if (lockCount === 1) applyLock();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseScrollLock();
  };
}

export function releaseScrollLock(): void {
  if (typeof document === "undefined") return;
  if (lockCount <= 0) return;
  lockCount -= 1;
  if (lockCount === 0) releaseLock();
}
