// Writes .br and .gz next to every compressible file of dist/client (JS, CSS, SVG, JSON, HTML), once at build time.
// The server's serveStatic({ precompressed: true }) picks the variant the browser accepts, so hashed assets get maximum
// compression (brotli 11, gzip 9) with zero CPU per request. Files under 1 KB, or that do not shrink, are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/client');
const COMPRESSIBLE = /\.(js|mjs|css|svg|json|html|txt|xml|map)$/;
const MIN_BYTES = 1024;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });

let raw = 0;
let brotli = 0;
let count = 0;
for (const file of walk(root)) {
  if (!COMPRESSIBLE.test(file)) continue;
  const source = fs.readFileSync(file);
  if (source.length < MIN_BYTES) continue;
  const br = zlib.brotliCompressSync(source, {
    params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: source.length },
  });
  const gz = zlib.gzipSync(source, { level: 9 });
  if (br.length < source.length) fs.writeFileSync(`${file}.br`, br);
  if (gz.length < source.length) fs.writeFileSync(`${file}.gz`, gz);
  raw += source.length;
  brotli += Math.min(br.length, source.length);
  count += 1;
}
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`[precompress] ${count} files: ${kb(raw)} → ${kb(brotli)} brotli`);
