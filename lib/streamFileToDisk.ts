import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

/** Stream a browser File to disk — avoids loading whole video into RAM. */
export async function streamFileToDisk(file: File, destPath: string): Promise<void> {
  const webStream = file.stream();
  const nodeStream = Readable.fromWeb(
    webStream as import("stream/web").ReadableStream
  );
  await pipeline(nodeStream, createWriteStream(destPath));
}
