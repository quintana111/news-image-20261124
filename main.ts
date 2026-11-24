// news-image-20261124 — "Tuesday 24 November 2026 — The World in One Page
// (48 stories, date-checked)". Node 22 stdlib only, no network, no deps.
// Copies the committed entry.png (rendered from DESIGN.md + STORIES.md) to
// /output/entry.png and verifies the copy byte-for-byte.
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "entry.png");
const OUT_DIR = "/output";
const OUT = join(OUT_DIR, "entry.png");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function main() {
  if (!existsSync(SRC)) {
    console.error("entry.png not found next to main.ts:", SRC);
    process.exit(1);
  }
  const data = readFileSync(SRC);
  if (data.length === 0 || data.length > 1024 * 1024) {
    console.error("entry.png has unexpected size:", data.length);
    process.exit(1);
  }
  // PNG signature check (first 8 bytes).
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!data.subarray(0, 8).equals(sig)) {
    console.error("entry.png is not a PNG file");
    process.exit(1);
  }
  // PNG dimension check: parse the IHDR chunk (width/height, big-endian uint32).
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  console.log("dimensions:", width + "x" + height);
  if (width !== 1024 || height !== 1024) {
    console.error("entry.png must be 1024x1024, got:", width + "x" + height);
    process.exit(1);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  copyFileSync(SRC, OUT);
  const copied = readFileSync(OUT);
  const srcHash = sha256(data);
  const outHash = sha256(copied);
  console.log("entry.png bytes:", data.length);
  console.log("source sha256:", srcHash);
  console.log("output sha256:", outHash);
  if (srcHash !== outHash || copied.length !== data.length) {
    console.error("copy verification failed: output differs from source");
    process.exit(1);
  }
  console.log("OK: /output/entry.png written and verified");
}

main();
