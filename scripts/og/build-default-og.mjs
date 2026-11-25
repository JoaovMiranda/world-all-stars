#!/usr/bin/env node
// Default Open Graph card (handoff T4.5): apps/web/public/og/default.png, 1200×630, drawn from the theme tokens
// (packages/shared/src/theme/theme.css) with Node built-ins only: no image library, no external fonts. The wordmark is
// a pre-rasterized 5×7 block font (rectangles), the star is a supersampled polygon, the rules use the metallic gold.
//
// Usage: node scripts/og/build-default-og.mjs   (or `pnpm og:default`; re-run after changing the tokens)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const OUT = join(ROOT, 'apps/web/public/og/default.png');
const W = 1200;
const H = 630;

// ── tokens ──
const css = readFileSync(join(ROOT, 'packages/shared/src/theme/theme.css'), 'utf8');
const token = (name) => {
  const m = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!m) throw new Error(`token --${name} not found in theme.css`);
  return m[1];
};
const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const grad = /--grad:\s*linear-gradient\([^,]+,\s*(#[0-9a-fA-F]{6})\s+(\d+)%,\s*(#[0-9a-fA-F]{6})\s+(\d+)%,\s*(#[0-9a-fA-F]{6})\s+(\d+)%\)/.exec(css);
if (!grad) throw new Error('token --grad not found in theme.css');
const GOLD = [
  [Number(grad[2]) / 100, rgb(grad[1])],
  [Number(grad[4]) / 100, rgb(grad[3])],
  [Number(grad[6]) / 100, rgb(grad[5])],
];
const BG = rgb(token('midnight'));
const INK = rgb(token('on-midnight'));
// Dark-theme --surface ("gala night" panel) for the background lift.
const surfaceDark = /\[data-theme="dark"\][^}]*--surface:\s*(#[0-9a-fA-F]{6})/s.exec(css);
if (!surfaceDark) throw new Error('dark --surface not found in theme.css');
const PANEL = rgb(surfaceDark[1]);

// ── canvas ──
const px = new Uint8Array(W * H * 3);
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const set = (x, y, c, alpha = 1) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  const cur = [px[o], px[o + 1], px[o + 2]];
  const out = alpha >= 1 ? c : mix(cur, c, alpha);
  px[o] = out[0];
  px[o + 1] = out[1];
  px[o + 2] = out[2];
};
/** Metallic gold at position t ∈ [0, 1] along the 135° gradient. */
const gold = (t) => {
  const u = Math.min(1, Math.max(0, t));
  for (let i = 1; i < GOLD.length; i++) if (u <= GOLD[i][0]) return mix(GOLD[i - 1][1], GOLD[i][1], (u - GOLD[i - 1][0]) / (GOLD[i][0] - GOLD[i - 1][0] || 1));
  return GOLD.at(-1)[1];
};
const rect = (x0, y0, w, h, color) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, typeof color === 'function' ? color(x, y) : color);
};
const goldAt = (x, y) => gold((x / W + y / H) / 2);

// Background: midnight with a soft vertical lift towards the panel colour.
for (let y = 0; y < H; y++) rect(0, y, W, 1, mix(BG, PANEL, (y / H) * 0.9));

// Programme frame: a thin gold rule inset from the edges, and a heavier band at the bottom.
const inset = 28;
rect(inset, inset, W - 2 * inset, 2, goldAt);
rect(inset, H - inset - 2, W - 2 * inset, 2, goldAt);
rect(inset, inset, 2, H - 2 * inset, goldAt);
rect(W - inset - 2, inset, 2, H - 2 * inset, goldAt);
rect(0, H - 10, W, 10, goldAt);

// ── star (5 points, supersampled 4×4 for smooth edges) ──
const star = (cx, cy, outer, inner) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const inside = (x, y) => {
    let hit = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  const S = 4;
  for (let y = Math.floor(cy - outer); y <= Math.ceil(cy + outer); y++)
    for (let x = Math.floor(cx - outer); x <= Math.ceil(cx + outer); x++) {
      let n = 0;
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) if (inside(x + (sx + 0.5) / S, y + (sy + 0.5) / S)) n++;
      if (n) set(x, y, gold((x - (cx - outer) + (y - (cy - outer))) / (4 * outer)), n / (S * S));
    }
};
star(214, 300, 150, 60);

// ── wordmark: 5×7 block glyphs ──
const GLYPHS = {
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
};
const word = (text, x0, y0, scale, color) => {
  let x = x0;
  for (const ch of text) {
    const g = GLYPHS[ch];
    g.forEach((row, gy) => {
      for (let gx = 0; gx < 5; gx++) if (row[gx] === '1') rect(x + gx * scale, y0 + gy * scale, scale, scale, color);
    });
    x += 6 * scale;
  }
  return x - scale;
};
const textX = 410;
word('WORLD', textX, 176, 14, INK);
const end = word('ALL STARS', textX, 316, 14, goldAt);
// Honour rule under the wordmark.
rect(textX, 452, end - textX, 4, goldAt);

// ── PNG (RGB, 8 bit, filter 0) ──
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr.set([8, 2, 0, 0, 0], 8);
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (W * 3 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`og: wrote ${OUT.replace(ROOT, '')} (${W}×${H}, ${png.length} bytes)`);
