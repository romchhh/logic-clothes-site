async function posterFromVideoElement(
  video: HTMLVideoElement,
  maxEdge: number
): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("video"));
  });

  try {
    video.currentTime = Math.min(0.25, video.duration * 0.05 || 0.1);
  } catch {
    video.currentTime = 0;
  }
  await new Promise<void>((resolve) => {
    if (video.readyState >= 2) resolve();
    else video.onseeked = () => resolve();
  });

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
  return canvas.toDataURL("image/jpeg", 0.72);
}

/** One lightweight JPEG poster from a local video file (admin preview). */
export async function captureVideoPoster(
  file: File,
  maxEdge = 480
): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = objectUrl;
    return await posterFromVideoElement(video, maxEdge);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Poster from an uploaded URL (same origin /assets/products/…). */
export async function captureVideoPosterFromUrl(
  src: string,
  maxEdge = 480
): Promise<string> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = `${src.split("#")[0]}#t=0.1`;
  return posterFromVideoElement(video, maxEdge);
}
