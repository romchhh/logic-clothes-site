/** Magic-byte sniffing for uploads (client + server). */

function bytesToLatin1(buf: Uint8Array | Buffer, len: number): string {
  const slice = buf.subarray(0, Math.min(len, buf.length));
  let s = "";
  for (let i = 0; i < slice.length; i++) s += String.fromCharCode(slice[i]!);
  return s;
}

export function looksLikeVideoBytes(buf: Uint8Array | Buffer): boolean {
  if (buf.length < 12) return false;
  const head = bytesToLatin1(buf, 16);
  if (head.includes("ftyp")) return true;
  if (
    bytesToLatin1(buf, 4) === "RIFF" &&
    bytesToLatin1(buf.subarray(8), 4) === "WEBM"
  ) {
    return true;
  }
  return false;
}

export function looksLikeImageBytes(buf: Uint8Array | Buffer): boolean {
  if (buf.length < 4) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return true;
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true;
  if (
    buf.length >= 12 &&
    bytesToLatin1(buf, 4) === "RIFF" &&
    bytesToLatin1(buf.subarray(8), 4) === "WEBP"
  ) {
    return true;
  }
  return false;
}
