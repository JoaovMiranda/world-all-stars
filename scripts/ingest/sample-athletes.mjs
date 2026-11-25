#!/usr/bin/env node
// Random, reproducible sample of athletes from a crawler CSV (data/seeds/atletas-2.csv format) as a `pnpm ingest collect
// --list` file: one "<wikipedia url>,<sport slug>" line per athlete. Only rows with an English Wikipedia article are
// eligible (the collector skips people without one); the sport slug comes from the sports catalog names (en/pt-BR/es).
//
// Usage: node scripts/ingest/sample-athletes.mjs [--from data/seeds/atletas-2.csv] [--n 200] [--seed 42] [--out file]
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const from = opt('from', 'data/seeds/atletas-2.csv');
const n = Number(opt('n', '200'));
const seed = Number(opt('seed', '42'));
const out = opt('out', `data/review/sample-${n}.csv`);

/** Minimal CSV line parser (quoted fields with commas). */
const parse = (line) => {
  const fields = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"' && quoted) {
      cur += '"';
      i++;
    } else if (ch === '"') quoted = !quoted;
    else if (ch === ',' && !quoted) {
      fields.push(cur);
      cur = '';
    } else cur += ch;
  }
  fields.push(cur);
  return fields;
};

/** mulberry32: small seeded PRNG, so the same --seed always gives the same sample. */
const rng = (s) => () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const catalog = JSON.parse(readFileSync('data/catalog/sports.catalog.json', 'utf8'));
const sportSlug = new Map();
for (const sport of catalog.sports ?? []) {
  for (const name of Object.values(sport.names ?? {})) sportSlug.set(norm(String(name)), sport.slug);
  sportSlug.set(norm(sport.slug), sport.slug);
}

// Crawler sport labels whose catalog name points elsewhere (the catalog's pt-BR "Jiu-jitsu" is Japanese jujutsu, while the
// crawler's "jiu-jitsu" is Brazilian jiu-jitsu, slug `jiu-jitsu` in the ingestion providers).
const SPORT_ALIASES = new Map([
  ['jiu-jitsu', 'jiu-jitsu'],
  ['futebol', 'football'],
]);
for (const [label, slug] of SPORT_ALIASES) sportSlug.set(label, slug);

const lines = readFileSync(from, 'utf8').split(/\r?\n/);
const header = parse(lines[0]);
const col = (name) => header.indexOf(name);
const [iUrl, iSport, iName] = [col('wikipedia_urls'), col('esportes'), col('nome')];
const eligible = [];
for (const line of lines.slice(1)) {
  if (!line) continue;
  const row = parse(line);
  const url = (row[iUrl] ?? '').split(/[|;\s]+/).find((u) => /en\.wikipedia\.org\/wiki\//.test(u));
  if (!url) continue;
  const firstSport = (row[iSport] ?? '').split(/[|;,]/)[0] ?? '';
  eligible.push({ url, sport: sportSlug.get(norm(firstSport)) ?? '', name: row[iName] });
}

const random = rng(seed);
for (let i = eligible.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
}
const sample = eligible.slice(0, n);
writeFileSync(out, `${['# name,sport (sample of ' + sample.length + ' from ' + from + ', seed ' + seed + ')', ...sample.map((s) => `${s.url},${s.sport}`)].join('\n')}\n`);
const bySport = Object.entries(Object.groupBy(sample, (s) => s.sport || '(unmapped)')).map(([k, v]) => `${k}:${v.length}`);
console.log(`${eligible.length} eligible rows with an English article; wrote ${sample.length} to ${out}`);
console.log(bySport.sort().join(' '));
