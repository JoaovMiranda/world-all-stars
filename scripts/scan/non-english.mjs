#!/usr/bin/env node
// Scans repository code and docs for Portuguese text outside the allowed i18n catalogs (D35).
// Markers: accented characters common in Portuguese plus a short word list.
//
// Usage: node scripts/scan/non-english.mjs [--details] [--fail]
//   --details  print every matching line (path:line: text)
//   --fail     exit with code 1 when any hit is found (CI mode, `pnpm lint:language`)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SCAN_DIRS = ['apps', 'packages', 'scripts', '.github'];
const SCAN_FILES = ['README.md', 'data/seeds/README.md'];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.turbo', 'coverage', 'playwright-report', 'test-results']);
const EXTENSIONS = /\.(ts|tsx|mjs|cjs|js|md|yml|yaml|json|sql|css|html)$/;

// Excluded on purpose (D36: crawler tooling stays untouched; i18n catalogs hold localized UI text).
const ALLOWLIST = [
  /^scripts\/crawler\//,
  /^scripts\/scan\/non-english\.mjs$/,
  /^data\/seeds\/(atletas\.csv|fontes-crawler\.csv|relatorio-crawler\.md)$/,
  /^packages\/shared\/src\/i18n\//,
  /^packages\/shared\/src\/consts\/[^/]*-messages\.const\.ts$/,
  /^packages\/db\/src\/seeds\/content-translations\.json$/,
  // Tests: localized inputs (pt-BR comments, names) and assertions on pt-BR/es output.
  /\.test\.(ts|tsx)$/,
  // Fixtures and demo data mirror localized prototype content.
  /^apps\/web\/src\/fixtures\//,
  /^apps\/web\/src\/data\/fixtures\//,
  /^scripts\/fixtures\//,
  // Localized label data (pt/es columns) and Portuguese data-matching literals.
  /^packages\/db\/src\/seeds\/(domain|sources-policy)\.seed\.ts$/,
  /^scripts\/catalog\/sports\.seed\.mjs$/,
  /^packages\/db\/src\/consts\/title-end-reason-patterns\.const\.ts$/,
  /^packages\/shared\/src\/consts\/org-labels\.const\.ts$/,
  /^packages\/ingest\/src\/canonical\/canonical-writer\.ts$/, // pt/es labels of historical countries
  /^packages\/ingest\/src\/providers\/football-champions\.const\.ts$/, // pt/es competition names
  // Legacy Portuguese URL values, kept only to answer 301 (D35).
  /^apps\/server\/src\/web\/legacy-url-map\.const\.ts$/,
  // Proper names with accents (Pelé, André Galvão, São Paulo…) in data and examples.
  /^packages\/ingest\/src\/providers\/bjj-champions\.const\.ts$/,
  /^packages\/ingest\/src\/identity\/identity-sample\.const\.ts$/,
  /^packages\/ingest\/src\/cli\/ingest\.cli\.ts$/,
  /^packages\/shared\/src\/helpers\/(text-normalize|wikimedia-url|source-url)\.helper\.ts$/,
  /^apps\/web\/src\/shared-ui\/breadcrumb\.component\.tsx$/,
  /^apps\/web\/src\/modules\/athletes\/athlete-profile\.helper\.ts$/,
  /^packages\/ranking\/src\/methodologies\/football-champions\/METHODOLOGY\.md$/,
  // Quotes a pt-BR UI label next to its English translation; Spanish UI label described in CSS.
  /^packages\/shared\/src\/schemas\/admin-curation\.schema\.ts$/,
  /^apps\/web\/src\/app\/styles\.css$/,
  // Legacy crawler file names (D36: atletas.csv, fontes-crawler.csv) documented in the seeds README.
  /^data\/seeds\/README\.md$/,
  // Known finding (follow-up): anonymized display name 'Usuário removido' should come from i18n.
  /^packages\/shared\/src\/helpers\/account\.helper\.ts$/,
  // pt-BR web catalogs: `apps/web/src/**/*.const.ts` with sibling `.en.ts`/`.es.ts` translations (checked below).
];

const ACCENTS = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/;
const WORDS =
  /\b(nao|sim|rodar|agora|atleta|esporte|conquista|fonte|sugestao|mensagem|lidas|filtro|tipo|visao|carreira|organizador|informado|campeao|titulo|pais|comentarios|analise)s?\b/i;

const args = new Set(process.argv.slice(2));

function* walk(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.test(name)) yield full;
  }
}

function isWebCatalog(path) {
  if (!/^apps\/web\/src\/.+\.const\.ts$/.test(path)) return false;
  const base = join(ROOT, path.replace(/\.const\.ts$/, ''));
  for (const suffix of ['.en.ts', '.es.ts', '.const.en.ts', '.const.es.ts']) {
    try {
      statSync(base + suffix);
      return true;
    } catch {}
  }
  return false;
}

function isAllowed(path) {
  return ALLOWLIST.some((pattern) => pattern.test(path)) || isWebCatalog(path) || /\.(en|es|pt)\.ts$/.test(path);
}

const files = [...SCAN_DIRS.flatMap((dir) => [...walk(join(ROOT, dir))]), ...SCAN_FILES.map((file) => join(ROOT, file))];
const results = [];
for (const file of files) {
  const path = relative(ROOT, file);
  if (isAllowed(path)) continue;
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  const hits = [];
  text.split('\n').forEach((line, index) => {
    if (ACCENTS.test(line) || WORDS.test(line)) hits.push([index + 1, line.trim().slice(0, 140)]);
  });
  if (hits.length > 0) results.push({ path, hits });
}

results.sort((a, b) => b.hits.length - a.hits.length || a.path.localeCompare(b.path));
const total = results.reduce((sum, r) => sum + r.hits.length, 0);
console.log(`Non-English hits: ${total} lines in ${results.length} files\n`);
console.log('| Path | Lines |\n|---|---|');
for (const { path, hits } of results) console.log(`| \`${path}\` | ${hits.length} |`);
if (args.has('--details')) {
  console.log('\n## Details\n');
  for (const { path, hits } of results) for (const [line, text] of hits) console.log(`- ${path}:${line}: ${text.replaceAll('|', '\\|')}`);
}
if (args.has('--fail') && total > 0) process.exit(1);
