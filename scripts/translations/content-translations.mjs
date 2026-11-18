#!/usr/bin/env node
// Builds packages/db/src/seeds/content-translations.json: en/es versions of the catalog content (doc 12), seeded
// into the *_translations tables by `pnpm db:seed` (no network there). Run when the prototype content changes:
//   pnpm translations:content            # adds new texts, fetches Wikidata labels that are still missing
//   pnpm translations:content --refresh  # fetches the Wikidata labels again
// Sources: Wikidata labels for names of entities with a QID (sports, cities, competitions) and of countries (by ISO
// 3166-1 alpha-2, P297); everything else (bios, descriptions, rules, titles…) is translated by hand IN the JSON
// (source "manual"): the script never overwrites a translation that is already there. Missing ones are listed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadPrototype } from '../fixtures/prototype-loader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MOCK_DIR = path.join(ROOT, 'plan/front-prototype/mock');
const OUT = path.join(ROOT, 'packages/db/src/seeds/content-translations.json');
const LOCALES = ['en', 'es'];
const REFRESH = process.argv.includes('--refresh');

// Wikidata API etiquette: identify the client, one request at a time, a pause between requests.
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const USER_AGENT = 'WorldAllStars-content-translations/1.0 (catalog translation script; https://www.wikidata.org/wiki/Wikidata:Data_access)';
const PAUSE_MS = 1000;
const BATCH = 50;

/** Translation table → its parent (FK column) and translated columns; `label` = column filled from Wikidata labels. */
const TABLES = {
  athlete_translations: { parent: 'athletes', fk: 'athlete_id', fields: ['short_bio'], ref: 'slug' },
  athlete_milestone_translations: { parent: 'athlete_milestones', fk: 'milestone_id', fields: ['title'], ref: 'kind' },
  sport_translations: { parent: 'sports', fk: 'sport_id', fields: ['name', 'description', 'rules_summary', 'pinnacle'], label: 'name', ref: 'slug' },
  sport_group_translations: { parent: 'sport_groups', fk: 'group_id', fields: ['name'], ref: 'slug' },
  sport_subgroup_translations: { parent: 'sport_subgroups', fk: 'subgroup_id', fields: ['name'], ref: 'slug' },
  sport_category_translations: { parent: 'sport_categories', fk: 'category_id', fields: ['name'], ref: 'slug' },
  country_translations: { parent: 'countries', fk: 'country_id', fields: ['name'], label: 'name', ref: 'iso2' },
  city_translations: { parent: 'cities', fk: 'city_id', fields: ['name'], label: 'name', ref: 'wikidata_qid' },
  competition_translations: { parent: 'competitions', fk: 'competition_id', fields: ['name'], label: 'name', ref: 'slug' },
  award_translations: { parent: 'awards', fk: 'award_id', fields: ['name'], ref: 'slug' },
  observance_day_translations: { parent: 'observance_days', fk: 'observance_day_id', fields: ['name'], ref: 'slug' },
  greats_dossier_translations: { parent: 'greats_dossiers', fk: 'dossier_id', fields: ['headline'], ref: 'athlete_id' },
  greats_evidence_translations: { parent: 'greats_evidences', fk: 'evidence_id', fields: ['description'], ref: 'evidence_type' },
  governance_model_translations: { parent: 'governance_models', fk: 'governance_model_id', fields: ['name', 'summary'], ref: 'slug' },
  organization_kind_translations: { parent: 'organization_kinds', fk: 'organization_kind_id', fields: ['name'], ref: 'slug' },
  prize_form_translations: { parent: 'prize_forms', fk: 'prize_form_id', fields: ['name'], ref: 'slug' },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wikidata = async (params) => {
  const url = `${WIKIDATA_API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const res = await fetch(url, { headers: { 'user-agent': USER_AGENT, accept: 'application/json' } });
  if (!res.ok) throw new Error(`Wikidata ${res.status} for ${url}`);
  await sleep(PAUSE_MS);
  return res.json();
};
/** en/es labels of QIDs (first letter upper-cased: Wikidata writes common nouns in lower case). */
const fetchLabels = async (qids) => {
  const out = new Map();
  for (let i = 0; i < qids.length; i += BATCH) {
    const ids = qids.slice(i, i + BATCH);
    const json = await wikidata({ action: 'wbgetentities', ids: ids.join('|'), props: 'labels', languages: LOCALES.join('|') });
    for (const id of ids) {
      const labels = json.entities?.[id]?.labels ?? {};
      out.set(id, Object.fromEntries(LOCALES.map((l) => [l, labels[l]?.value ? labels[l].value[0].toUpperCase() + labels[l].value.slice(1) : null])));
    }
  }
  return out;
};
/** Country QID by ISO 3166-1 alpha-2 (P297). */
const countryQid = async (iso2) => {
  const json = await wikidata({ action: 'query', list: 'search', srsearch: `haswbstatement:P297=${iso2}`, srnamespace: '0', srlimit: '1' });
  return json.query?.search?.[0]?.title ?? null;
};

// ── pt-BR source texts from the prototype (same data `pnpm db:seed` loads) ──
if (!fs.existsSync(MOCK_DIR)) throw new Error(`${MOCK_DIR} not found: the source texts come from the prototype (plan/).`);
const { db, catalog } = loadPrototype(MOCK_DIR);
const live = (table) => (db.tables[table] ?? []).filter((r) => !r.deleted_at);
/** Labels that the seed writes from the prototype catalog (not from tables). */
const CATALOG_SOURCES = {
  governance_model_translations: (slug) => catalog.governance[slug] && { name: catalog.governance[slug].name, summary: catalog.governance[slug].summary },
  organization_kind_translations: (slug) => catalog.orgKinds[slug] && { name: catalog.orgKinds[slug][0] },
  prize_form_translations: (slug) => catalog.prizeForms[slug] && { name: catalog.prizeForms[slug] },
};

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { tables: {} };
const result = {};
const qidByParent = new Map();
for (const [table, spec] of Object.entries(TABLES)) {
  const parents = new Map(live(spec.parent).map((p) => [p.id, p]));
  const rows = CATALOG_SOURCES[table]
    ? [...parents.values()].flatMap((p) => {
        const pt = CATALOG_SOURCES[table](p.slug);
        return pt ? [{ [spec.fk]: p.id, locale: 'pt-BR', ...pt }] : [];
      })
    : live(table);
  const entries = {};
  for (const row of rows.filter((r) => r.locale === 'pt-BR')) {
    const parentId = row[spec.fk];
    const parent = parents.get(parentId);
    if (!parent) continue;
    const old = previous.tables?.[table]?.[parentId] ?? {};
    const pick = (src) => Object.fromEntries(spec.fields.map((f) => [f, src?.[f] ?? null]));
    // Translations already in the prototype (e.g. English sport names) are a starting point, never an override.
    const protoRow = (l) => rows.find((r) => r[spec.fk] === parentId && r.locale === l);
    const entry = { ref: String(parent[spec.ref] ?? parentId), source: old.source ?? 'manual', 'pt-BR': pick(row) };
    for (const l of LOCALES) {
      const merged = pick(old[l]);
      for (const f of spec.fields) merged[f] ??= protoRow(l)?.[f] ?? null;
      entry[l] = merged;
    }
    if (spec.label && (parent.wikidata_qid || table === 'country_translations')) qidByParent.set(`${table}|${parentId}`, parent.wikidata_qid ?? null);
    entries[parentId] = entry;
  }
  result[table] = entries;
}

// ── Wikidata labels (only where a label is still missing, or everything with --refresh) ──
const wanted = [...qidByParent.entries()].filter(([key]) => {
  const [table, id] = key.split('|');
  const field = TABLES[table].label;
  return REFRESH || LOCALES.some((l) => !result[table][id][l][field]);
});
for (const [key, qid] of wanted) {
  if (qid) continue;
  const [table, id] = key.split('|');
  qidByParent.set(key, await countryQid(result[table][id].ref));
}
const qids = [...new Set(wanted.map(([key]) => qidByParent.get(key)).filter(Boolean))];
const labels = qids.length ? await fetchLabels(qids) : new Map();
for (const [key] of wanted) {
  const [table, id] = key.split('|');
  const qid = qidByParent.get(key);
  const found = qid ? labels.get(qid) : null;
  if (!found) continue;
  const entry = result[table][id];
  const field = TABLES[table].label;
  for (const l of LOCALES) if (found[l] && (REFRESH || !entry[l][field])) entry[l][field] = found[l];
  const otherFields = TABLES[table].fields.length > 1;
  entry.source = otherFields ? `wikidata:${qid}+manual` : `wikidata:${qid}`;
}

const missing = Object.entries(result).flatMap(([table, entries]) =>
  Object.entries(entries).flatMap(([id, e]) => LOCALES.flatMap((l) => TABLES[table].fields.filter((f) => e['pt-BR'][f] && !e[l][f]).map((f) => `${table} ${e.ref} ${l}.${f}`))),
);
fs.writeFileSync(
  OUT,
  `${JSON.stringify({ about: 'en/es of the catalog content (scripts/translations/content-translations.mjs). source: wikidata:<QID> = names from Wikidata labels; manual = translated by hand.', tables: result }, null, 2)}\n`,
);
console.log(`[translations] ${path.relative(ROOT, OUT)}: ${Object.values(result).reduce((n, e) => n + Object.keys(e).length, 0)} entries, ${qids.length} Wikidata entities fetched, ${missing.length} translations missing`);
if (missing.length) console.log(missing.slice(0, 40).join('\n') + (missing.length > 40 ? `\n… +${missing.length - 40}` : ''));
