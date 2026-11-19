#!/usr/bin/env node
// Builds data/catalog/sports.catalog.json from the curated discovery seed (sports.seed.mjs):
// enwiki title → Wikidata item (QID via sitelink, never built from the name) → en/pt/es labels.
// Polite: batches of 50 titles, 1 s between calls, generic User-Agent, cached in .data/catalog-cache.
//   node scripts/catalog/build-sports-catalog.mjs [--refresh]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CURATED_NAMES, MULTISPORT_EVENTS, MULTISPORT_ORGS, NEW_SUBGROUPS, REVIEW_NOTES, SPORT_ALIASES, SPORTS } from './sports.seed.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = path.join(ROOT, 'data/catalog');
const CACHE = path.join(ROOT, '.data/catalog-cache');
const API = 'https://www.wikidata.org/w/api.php';
const UA = 'WorldAllStarsBot/0.1 (sports catalog; polite, cached)';
const REFRESH = process.argv.includes('--refresh');
const LANGS = ['en', 'pt', 'es'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cached = async (key, fetcher) => {
  const file = path.join(CACHE, `${key}.json`);
  if (!REFRESH && fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const data = await fetcher();
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data));
  await sleep(1000);
  return data;
};
const wbget = async (titles, batch) =>
  cached(`entities-${batch}`, async () => {
    const url = `${API}?${new URLSearchParams({ action: 'wbgetentities', sites: 'enwiki', titles: titles.join('|'), props: 'labels|sitelinks|claims', languages: LANGS.join('|'), sitefilter: 'enwiki|ptwiki|eswiki', redirects: 'yes', format: 'json' })}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(`Wikidata ${res.status} ${json.error?.info ?? ''}`);
    return json;
  });

const parsePrograms = (spec) =>
  spec.split(/\s+/).filter(Boolean).map((token) => {
    const [code, arg] = token.split(':');
    if (code === 'OSf') return { event: 'OS', status: 'confirmed_future', years: arg.split(',').map(Number) };
    if (code === 'OSd') return { event: 'OS', status: 'discontinued', years: arg.split(',').map(Number) };
    if (code === 'CG') return { event: 'CG', status: arg, years: [] };
    if (code === 'YOG') return { event: 'YOG', status: 'youth_only', years: [] };
    return { event: code, status: 'current', years: [] };
  });

const titles = SPORTS.map((s) => s[1]).filter(Boolean);
const byTitle = new Map();
for (let i = 0; i < titles.length; i += 50) {
  const data = await wbget(titles.slice(i, i + 50), i / 50);
  for (const entity of Object.values(data.entities ?? {})) {
    const enTitle = entity.sitelinks?.enwiki?.title;
    if (enTitle) byTitle.set(enTitle, entity);
  }
  // `normalized`/`redirects` map the requested title to the one returned.
  for (const n of [...(data.normalized ?? []), ...(data.redirects ?? [])]) if (byTitle.has(n.to)) byTitle.set(n.from, byTitle.get(n.to));
}

const issues = [];
const seen = new Set();
const sports = SPORTS.map(([slug, title, subgroup, format, environment, parent, programmes]) => {
  if (seen.has(slug)) issues.push(`duplicate slug ${slug}`);
  seen.add(slug);
  const entity = title ? byTitle.get(title) : null;
  if (title && !entity) issues.push(`${slug}: no Wikidata item for enwiki "${title}"`);
  const label = (l) => entity?.labels?.[l]?.value ?? null;
  const curated = CURATED_NAMES[slug];
  const names = { en: label('en') ?? title ?? slug, 'pt-BR': label('pt') ?? curated?.[0] ?? null, es: label('es') ?? curated?.[1] ?? null };
  if (!label('pt')) issues.push(`${slug}: no Wikidata pt label${curated ? ' (curated name used)' : ''}`);
  if (parent && !SPORTS.some((s) => s[0] === parent)) issues.push(`${slug}: parent ${parent} not in catalog`);
  return {
    slug, subgroup, format, environment, parent,
    wikidataQid: entity?.id ?? null,
    wikipediaUrl: entity?.sitelinks?.enwiki ? `https://en.wikipedia.org/wiki/${encodeURIComponent(entity.sitelinks.enwiki.title.replaceAll(' ', '_'))}` : null,
    names: { en: capital(names.en), 'pt-BR': names['pt-BR'] ? capital(names['pt-BR']) : null, es: names.es ? capital(names.es) : null },
    programmes: parsePrograms(programmes),
    aliases: (SPORT_ALIASES[slug] ?? []).map(([name, kind]) => ({ name, kind })),
    reviewNote: REVIEW_NOTES[slug] ?? null,
  };
});
function capital(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const catalog = { generatedAt: new Date().toISOString().slice(0, 10), source: 'Wikidata (CC0) via enwiki sitelinks; curated list in scripts/catalog/sports.seed.mjs', subgroups: NEW_SUBGROUPS, events: MULTISPORT_EVENTS, organizations: MULTISPORT_ORGS, sports };
fs.writeFileSync(path.join(OUT_DIR, 'sports.catalog.json'), `${JSON.stringify(catalog, null, 1)}\n`);
const report = [
  '# Sports catalog report', '',
  `Generated ${catalog.generatedAt}. ${sports.length} sports/disciplines, ${sports.filter((s) => s.wikidataQid).length} resolved to Wikidata.`, '',
  '## Issues', ...(issues.length ? issues.map((i) => `- ${i}`) : ['- none']), '',
  '## Review notes (programme status / relations)', ...sports.filter((s) => s.reviewNote).map((s) => `- **${s.slug}**: ${s.reviewNote}`), '',
  '## Catalog', '| slug | en | pt-BR | es | QID | parent | programmes |', '|---|---|---|---|---|---|---|',
  ...sports.map((s) => `| ${s.slug} | ${s.names.en} | ${s.names['pt-BR'] ?? '—'} | ${s.names.es ?? '—'} | ${s.wikidataQid ?? '—'} | ${s.parent ?? ''} | ${s.programmes.map((p) => `${p.event}:${p.status}${p.years.length ? `(${p.years.join(',')})` : ''}`).join(' ')} |`),
];
fs.writeFileSync(path.join(OUT_DIR, 'sports-catalog-report.md'), `${report.join('\n')}\n`);
console.log(`${sports.length} sports, ${sports.filter((s) => s.wikidataQid).length} with QID, ${issues.length} issue(s) → data/catalog/`);
