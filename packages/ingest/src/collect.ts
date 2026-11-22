// Autonomous collection (handoff v3 Fase 13 §1.2): one orchestrator, two modes. Code, network, RAM and the local
// model only: no human click on the happy path (validated AI output is auto-accepted, §1.1).
//   firstCollect: list → identity (athlete-list) → Wikidata (QID, birth, gender) → profile (Wikidata + Commons)
//                 → Wikipedia en text + revid → biography (Ollama) → auto-validation → profile.
//   update:       compares the Wikipedia revid with the last biography input; unchanged pages never reach Ollama.
import { type Database } from '@was/db';
import { sql } from 'drizzle-orm';

import { CanonicalWriter } from './canonical/canonical-writer';
import { type AiProvider, type EnrichItem, runBiography } from './enrich/ai';
import { ATHLETE_LIST_PROVIDER, type ListEntry, runAthleteList } from './providers/athlete-list.provider';
import type { IngestContext } from './providers/context';
import { runWikidata, WIKIDATA_PROVIDER } from './providers/wikidata.provider';
import { runWikidataProfile, WIKIDATA_PROFILE_PROVIDER } from './providers/wikidata-profile.provider';

export interface CollectReport {
  mode: 'first' | 'update';
  people: number;
  missing: string[];
  biography: Awaited<ReturnType<typeof runBiography>> | null;
  needsEnrichment: number;
  skippedUnchanged: number;
}

type Person = { id: string; name: string; full_name: string | null; birth_date: string | null; height_cm: number | null; title: string };

const peopleWithArticle = async (db: Database, ids: string[] | null) =>
  ((await db.execute(sql`
    select a.id, a.known_as name, a.full_name, a.birth_date, a.height_cm, x.external_id title
    from athletes a join entity_external_ids x on x.entity_id = a.id and x.provider = 'wikipedia_en' and x.deleted_at is null and x.is_current
    where a.deleted_at is null ${ids ? sql`and a.id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})` : sql``}`)) as unknown as { rows: Person[] }).rows;

/** Facts from the database given to the biography prompt (titles, clubs, birth, height). */
const factsOf = async (db: Database, p: Person) => {
  const titles = (await db.execute(sql`
    select coalesce(t.name, d.slug) name, g.year from recognition_grants g join recognition_definitions d on d.id = g.definition_id
    left join recognition_definition_translations t on t.definition_id = d.id and t.locale = 'en' where g.competitor_id = ${p.id} and g.deleted_at is null order by g.year`)) as unknown as { rows: { name: string; year: number }[] };
  const clubs = (await db.execute(sql`select t.name, at.from_year, at.to_year from athlete_teams at join teams t on t.id = at.team_id where at.athlete_id = ${p.id} and at.deleted_at is null order by at.from_year`)) as unknown as { rows: { name: string; from_year: number | null; to_year: number | null }[] };
  return [
    p.full_name && `full name ${p.full_name}`, p.birth_date && `born ${p.birth_date}`, p.height_cm && `height ${p.height_cm} cm`,
    titles.rows.length && `titles: ${titles.rows.map((t) => `${t.name} ${t.year}`).join(', ')}`,
    clubs.rows.length && `teams: ${clubs.rows.map((c) => `${c.name} (${c.from_year ?? '?'}–${c.to_year ?? '?'})`).join(', ')}`,
  ].filter(Boolean).join('; ');
};

/** Current revid of each article (50 per request, no text). */
const currentRevisions = async (ctx: IngestContext, titles: string[]) => {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 50) {
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', prop: 'revisions', rvprop: 'ids', titles: titles.slice(i, i + 50).join('|'), format: 'json', formatversion: '2' })}`;
    const doc = await ctx.document('wikipedia-en', url);
    if (!doc) continue;
    for (const pg of (JSON.parse(doc.text) as { query?: { pages?: { title: string; revisions?: { revid: number }[] }[] } }).query?.pages ?? []) if (pg.revisions?.[0]) out.set(pg.title, String(pg.revisions[0].revid));
  }
  return out;
};

/** Last revid each athlete's biography was generated from (`inputRef = <url>#rev:<revid>`). */
const lastBiographyRevisions = async (db: Database) =>
  new Map(((await db.execute(sql`
    select distinct on (l.entity_id) l.entity_id id, split_part(i.input_ref, '#rev:', 2) rev
    from ai_invocations i join ai_extraction_queue q on q.invocation_id = i.id join source_links l on l.id = q.source_link_id
    where i.task = 'biography' and i.status = 'ok' order by l.entity_id, i.created_at desc`)) as unknown as { rows: { id: string; rev: string }[] }).rows.map((r) => [r.id, r.rev]));

const biographies = async (ctx: IngestContext, provider: AiProvider | null, people: Person[]) => {
  const items: EnrichItem[] = [];
  for (const p of provider ? people : []) {
    if (ctx.cancelled?.()) break; // cooperative cancel of the job
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', prop: 'extracts|revisions', rvprop: 'ids', explaintext: '1', redirects: '1', titles: p.title, format: 'json', formatversion: '2' })}`;
    const doc = await ctx.document('wikipedia-en', url);
    const page = doc && (JSON.parse(doc.text) as { query?: { pages?: { extract?: string; revisions?: { revid: number }[] }[] } }).query?.pages?.[0];
    if (!page?.extract) continue;
    items.push({ entityId: p.id, name: p.name, sourceText: page.extract, sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(p.title.replaceAll(' ', '_'))}`, sectionKey: `rev:${page.revisions?.[0]?.revid ?? ''}`, facts: await factsOf(ctx.db, p) });
  }
  // OLLAMA_CONCURRENCY=1: items run one after the other (the local model is the bottleneck).
  return provider ? runBiography(ctx.db, provider, items) : null;
};

const write = (db: Database, providers: string[]) => new CanonicalWriter(db).writeProviders(providers);

/** First collection of a list of athletes (names, links or CSV lines). */
export const firstCollect = async (ctx: IngestContext, provider: AiProvider | null, entries: ListEntry[]): Promise<CollectReport> => {
  const list = await runAthleteList(ctx, entries);
  ctx.log(`athlete-list: ${list.resolved} resolved, ${list.missing.length} without an unambiguous article`);
  await write(ctx.db, [ATHLETE_LIST_PROVIDER]);
  const wanted = new Set(list.titles);
  const people = (await peopleWithArticle(ctx.db, null)).filter((p) => wanted.has(p.title));
  for (const l of await runWikidata(ctx, {})) ctx.log(l);
  await write(ctx.db, [WIKIDATA_PROVIDER]);
  for (const l of await runWikidataProfile(ctx, { entityIds: new Set(people.map((p) => p.id)) })) ctx.log(l);
  await write(ctx.db, [WIKIDATA_PROFILE_PROVIDER]);
  const biography = await biographies(ctx, provider, people);
  return { mode: 'first', people: people.length, missing: list.missing, biography, needsEnrichment: provider ? 0 : people.length, skippedUnchanged: 0 };
};

/** Periodic update: only articles whose revid changed since their last biography reach the model. */
export const updateCollect = async (ctx: IngestContext, provider: AiProvider | null, opts: { limit?: number | undefined } = {}): Promise<CollectReport> => {
  const people = (await peopleWithArticle(ctx.db, null)).slice(0, opts.limit ?? 100_000);
  for (const l of await runWikidataProfile(ctx, { entityIds: new Set(people.map((p) => p.id)) })) ctx.log(l);
  await write(ctx.db, [WIKIDATA_PROFILE_PROVIDER]);
  const [current, last] = await Promise.all([currentRevisions(ctx, people.map((p) => p.title)), lastBiographyRevisions(ctx.db)]);
  const changed = people.filter((p) => !last.has(p.id) || (current.get(p.title) ?? '') !== last.get(p.id));
  const biography = await biographies(ctx, provider, changed);
  return { mode: 'update', people: people.length, missing: [], biography, needsEnrichment: provider ? 0 : changed.length, skippedUnchanged: people.length - changed.length };
};
