#!/usr/bin/env node
// JS budget of the production build. Reads the Vite client manifest
// (apps/web/dist/client/.vite/manifest.json) and, for every page route, sums the gzip size of what the browser
// downloads before the page is interactive: the client entry + its static imports + the page chunk + its static
// imports (lazy imports such as ECharts or the globe are excluded: they load on demand).
//   VITE_DATA_SOURCE=http pnpm build && node scripts/ci/bundle-budget.mjs
// Env: BUDGET_KB (default 240), CSS_BUDGET_KB (default 30, the single stylesheet).
// The default is a REGRESSION GUARD at today's size (heaviest route ≈ 228 KB, Nov 2026): the doc 12 target is 170 KB,
// which the shared entry alone (≈ 175 KB: React, router, query, i18n) does not meet yet. Lower it as the entry shrinks.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const clientDir = path.resolve('apps/web/dist/client');
const manifestFile = path.join(clientDir, '.vite/manifest.json');
if (!fs.existsSync(manifestFile)) {
  console.error('bundle-budget: no manifest (run: VITE_DATA_SOURCE=http pnpm build)');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
const budget = Number(process.env.BUDGET_KB ?? 240) * 1024;
const TARGET = 170 * 1024;
const cssBudget = Number(process.env.CSS_BUDGET_KB ?? 30) * 1024;
const gzipCache = new Map();
const gz = (file) => {
  if (!gzipCache.has(file)) gzipCache.set(file, zlib.gzipSync(fs.readFileSync(path.join(clientDir, file)), { level: 9 }).length);
  return gzipCache.get(file);
};
/** The chunk and its static imports (what a <script type=module> pulls in). */
const closure = (key, into = new Set()) => {
  const chunk = manifest[key];
  if (!chunk || into.has(chunk.file)) return into;
  into.add(chunk.file);
  for (const k of chunk.imports ?? []) closure(k, into);
  return into;
};
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

const entryKey = 'src/app/entry-client.tsx';
const entry = closure(entryKey);
const pages = Object.keys(manifest).filter((k) => /^src\/modules\/.+\.page\.tsx$/.test(k));
let failed = false;
const rows = pages.map((page) => {
  const files = closure(page, new Set(entry));
  const total = [...files].reduce((s, f) => s + gz(f), 0);
  if (total > budget) failed = true;
  return { page: page.replace('src/modules/', ''), total };
});
rows.sort((a, b) => b.total - a.total);
const entryTotal = [...entry].reduce((s, f) => s + gz(f), 0);
console.log(`bundle-budget: shared entry ${kb(entryTotal)} gzip; budget per route ${kb(budget)} (target ${kb(TARGET)})`);
for (const r of rows.slice(0, 8)) console.log(`  ${r.total > budget ? 'OVER' : 'ok  '} ${kb(r.total).padStart(9)}  ${r.page}`);
if (rows.length > 8) console.log(`  … ${rows.length - 8} more routes, all smaller`);

const css = [...new Set(Object.values(manifest).flatMap((c) => [...(c.css ?? []), ...(c.file.endsWith('.css') ? [c.file] : [])]))];
const cssTotal = css.reduce((s, f) => s + gz(f), 0);
console.log(`  ${cssTotal > cssBudget ? 'OVER' : 'ok  '} ${kb(cssTotal).padStart(9)}  stylesheet (budget ${kb(cssBudget)})`);
if (cssTotal > cssBudget) failed = true;

if (failed) {
  console.error('bundle-budget: FAIL (a route or the stylesheet is over budget)');
  process.exit(1);
}
const overTarget = rows.filter((r) => r.total > TARGET).length;
console.log(`bundle-budget: ok${overTarget ? ` (${overTarget} route(s) still above the ${kb(TARGET)} target)` : ''}`);
