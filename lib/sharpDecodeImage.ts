import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

function looksLikeHeicError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /heif|heic|hevc|libde265/i.test(msg);
}

/** macOS fallback when sharp lacks HEIC codecs. */
async function heicViaSips(inputPath: string, outPath: string): Promise<void> {
  await execFileAsync("sips", [
    "-s",
    "format",
    "jpeg",
    inputPath,
    "--out",
    outPath,
  ]);
}

/**
 * Decode arbitrary image bytes to something sharp can pipeline (JPEG buffer).
 */
export async function decodeImageToJpegBuffer(
  buf: Buffer,
  filenameHint = "upload"
): Promise<Buffer> {
  try {
    return await sharp(buf).rotate().jpeg({ quality: 92 }).toBuffer();
  } catch (err) {
    if (process.platform !== "darwin" || !looksLikeHeicError(err)) {
      throw err;
    }
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "lc-heic-"));
    const inFile = path.join(dir, `${filenameHint}.heic`);
    const outFile = path.join(dir, `${filenameHint}.jpg`);
    try {
      await fs.writeFile(inFile, buf);
      await heicViaSips(inFile, outFile);
      return await fs.readFile(outFile);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }
}
