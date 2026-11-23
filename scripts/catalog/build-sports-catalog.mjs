#!/usr/bin/env node
// Builds data/catalog/sports.catalog.json from the curated discovery seed (sports.seed.mjs):
// enwiki title → Wikidata item (QID via sitelink, never built from the name) → en/pt/es labels.
// Polite: batches of 50 titles, 1 s between calls, generic User-Agent, cached in .data/catalog-cache.
//   node scripts/catalog/build-sports-catalog.mjs [--refresh]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BULK_REVIEW,
  CURATED_NAMES,
  FEDERATIONS,
  MULTISPORT_EVENTS,
  MULTISPORT_ORGS,
  NAME_OVERRIDES,
  NEW_SUBGROUPS,
  PENDING_ALIASES,
  REVIEW_LOG,
  SPORT_ALIASES,
  SPORTS,
} from './sports.seed.mjs';

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

const SUFFIX_STATUS = { '': 'current', f: 'confirmed_future', d: 'discontinued', x: 'demonstration' };
const years = (arg) => (arg ? arg.split(',').map(Number) : []);
const parsePrograms = (slug, spec) =>
  spec
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const [code, arg] = token.split(':');
      const [, event, suffix] = /^([A-Z]+)([fdx]?)$/.exec(code) ?? [];
      if (!event || !MULTISPORT_EVENTS[event]) throw new Error(`${slug}: unknown programme token ${token}`);
      if (event === 'CG') return { event, status: arg, years: [] };
      if (event === 'YOG') return { event, status: 'youth_only', years: years(arg) };
      if (suffix && !arg) throw new Error(`${slug}: ${token} needs years`);
      return { event, status: SUFFIX_STATUS[suffix], years: years(arg) };
    });
const aliasRows = (list) =>
  list.map(([name, kind, from = null, to = null]) => ({ name, kind, ...(from ? { validFromYear: from } : {}), ...(to ? { validToYear: to } : {}) }));

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
  const override = NAME_OVERRIDES[slug] ?? {};
  const names = {
    en: override.en ?? label('en') ?? title ?? slug,
    'pt-BR': override['pt-BR'] ?? label('pt') ?? curated?.[0] ?? null,
    es: override.es ?? label('es') ?? curated?.[1] ?? null,
  };
  if (!label('pt')) issues.push(`${slug}: no Wikidata pt label${curated ? ' (curated name used)' : ''}`);
  if (parent && !SPORTS.some((s) => s[0] === parent)) issues.push(`${slug}: parent ${parent} not in catalog`);
  return {
    slug,
    subgroup,
    format,
    environment,
    parent,
    wikidataQid: entity?.id ?? null,
    wikipediaUrl: entity?.sitelinks?.enwiki ? `https://en.wikipedia.org/wiki/${encodeURIComponent(entity.sitelinks.enwiki.title.replaceAll(' ', '_'))}` : null,
    names: { en: capital(names.en), 'pt-BR': names['pt-BR'] ? capital(names['pt-BR']) : null, es: names.es ? capital(names.es) : null },
    programmes: parsePrograms(slug, programmes),
    aliases: aliasRows(SPORT_ALIASES[slug] ?? []),
    review: REVIEW_LOG[slug] ? { status: REVIEW_LOG[slug][0], note: REVIEW_LOG[slug][1] } : null,
  };
});
for (const key of [...Object.keys(REVIEW_LOG), ...Object.keys(PENDING_ALIASES), ...Object.keys(NAME_OVERRIDES), ...FEDERATIONS.flatMap((f) => f.sports)])
  if (!seen.has(key)) issues.push(`review data references unknown slug ${key}`);
const federations = FEDERATIONS.map((f) => ({ ...f, aliases: aliasRows(f.aliases) }));
function capital(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const catalog = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: 'Wikidata (CC0) via enwiki sitelinks; curated list in scripts/catalog/sports.seed.mjs',
  subgroups: NEW_SUBGROUPS,
  events: MULTISPORT_EVENTS,
  organizations: MULTISPORT_ORGS,
  federations,
  sports,
};
fs.writeFileSync(path.join(OUT_DIR, 'sports.catalog.json'), `${JSON.stringify(catalog, null, 1)}\n`);
const progs = (s) => s.programmes.map((p) => `${p.event}:${p.status}${p.years.length ? `(${p.years.join(',')})` : ''}`).join(' ');
// Every entry whose programme status is ambiguous (youth, demonstration, future, discontinued) must carry a review.
const unreviewed = sports
  .filter((s) => !s.review && s.programmes.some((p) => p.status !== 'current' && !['core', 'optional', 'recognized'].includes(p.status)))
  .map((s) => s.slug);
const report = [
  '# Sports catalog report',
  '',
  `Generated ${catalog.generatedAt}. ${sports.length} sports/disciplines, ${sports.filter((s) => s.wikidataQid).length} resolved to Wikidata.`,
  '',
  '## Data issues (labels / Wikidata items)',
  ...(issues.length ? issues.map((i) => `- ${i}`) : ['- none']),
  '',
  '## Programme status and alias review (v3 §15.16–17, T1.5)',
  `${sports.filter((s) => s.review).length} entries reviewed, ${sports.filter((s) => s.review?.status !== 'reviewed' && s.review).length} of them still need a source. Unreviewed: ${unreviewed.length ? unreviewed.join(', ') : 'none'}.`,
  '',
  '| slug | status | programmes | decision and facts |',
  '|---|---|---|---|',
  ...sports.filter((s) => s.review).map((s) => `| ${s.slug} | ${s.review.status} | ${progs(s)} | ${s.review.note} |`),
  '',
  '### Programme classes',
  ...BULK_REVIEW.map(([status, note]) => `- **${status}**: ${note}`),
  '',
  '### Pending aliases (not emitted)',
  ...Object.entries(PENDING_ALIASES).flatMap(([slug, list]) => list.map(([name, note]) => `- **${slug}** → "${name}": ${note}`)),
  '',
  '### Federations (names and Olympic role with period)',
  '| slug | name | aliases | note |',
  '|---|---|---|---|',
  ...federations.map(
    (f) =>
      `| ${f.slug} | ${f.name} | ${f.aliases.map((a) => `${a.name} (${a.kind}${a.validFromYear || a.validToYear ? ` ${a.validFromYear ?? '?'}–${a.validToYear ?? ''}` : ''})`).join('; ') || '—'} | reviewed: ${f.note} |`,
  ),
  '',
  '## Catalog',
  '| slug | en | pt-BR | es | QID | parent | programmes |',
  '|---|---|---|---|---|---|---|',
  ...sports.map(
    (s) => `| ${s.slug} | ${s.names.en} | ${s.names['pt-BR'] ?? '—'} | ${s.names.es ?? '—'} | ${s.wikidataQid ?? '—'} | ${s.parent ?? ''} | ${progs(s)} |`,
  ),
];
fs.writeFileSync(path.join(OUT_DIR, 'sports-catalog-report.md'), `${report.join('\n')}\n`);
console.log(`${sports.length} sports, ${sports.filter((s) => s.wikidataQid).length} with QID, ${issues.length} issue(s) → data/catalog/`);
