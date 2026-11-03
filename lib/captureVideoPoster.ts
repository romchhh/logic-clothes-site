async function waitForSeek(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= 2) return;
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });
}

export async function seekVideo(
  video: HTMLVideoElement,
  time: number
): Promise<void> {
  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const t =
    duration > 0
      ? Math.min(Math.max(0, time), Math.max(0, duration - 0.05))
      : Math.max(0, time);
  if (Math.abs(video.currentTime - t) < 0.04 && video.readyState >= 2) {
    return;
  }
  video.currentTime = t;
  await new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    // Some browsers fire seeked before the listener attaches for tiny seeks.
    window.setTimeout(() => {
      if (video.readyState >= 2) done();
    }, 120);
  });
}

function drawPosterCanvas(
  video: HTMLVideoElement,
  maxEdge: number
): HTMLCanvasElement {
  const vw = video.videoWidth || 720;
  const vh = video.videoHeight || 1280;
  const scale = maxEdge / Math.max(vw, vh);
  const w = Math.max(1, Math.round(vw * scale));
  const h = Math.max(1, Math.round(vh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}

async function posterFromVideoElement(
  video: HTMLVideoElement,
  maxEdge: number,
  atTime?: number
): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    if (video.readyState >= 1) {
      resolve();
      return;
    }
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("video"));
  });

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const fallback =
    duration > 0 ? Math.min(0.35, duration * 0.08) : 0.15;
  await seekVideo(video, atTime ?? fallback);

  return drawPosterCanvas(video, maxEdge).toDataURL("image/jpeg", 0.72);
}

/** Capture current (or sought) frame as a JPEG File for upload. */
export async function captureVideoPosterFile(
  video: HTMLVideoElement,
  maxEdge = 960,
  filename = "video-poster.jpg"
): Promise<File> {
  await waitForSeek(video);
  const canvas = drawPosterCanvas(video, maxEdge);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("poster_blob"))),
      "image/jpeg",
      0.86
    );
  });
  return new File([blob], filename, { type: "image/jpeg" });
}

/** One lightweight JPEG poster from a local video file (admin preview). */
export async function captureVideoPoster(
  file: File,
  maxEdge = 480,
  atTime?: number
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;
    return await posterFromVideoElement(video, maxEdge, atTime);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Poster from an uploaded URL (same origin /assets/products/…). */
export async function captureVideoPosterFromUrl(
  src: string,
  maxEdge = 480,
  atTime?: number
): Promise<string> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  const base = src.split("#")[0];
  video.src = atTime != null ? base : `${base}#t=0.1`;
  return posterFromVideoElement(video, maxEdge, atTime);
}
