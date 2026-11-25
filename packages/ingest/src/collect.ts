// Autonomous collection (handoff v3 Phase 13 §1.2): one orchestrator, two modes. Code, network, RAM and the local
// model only: no human click on the happy path (validated AI output is auto-accepted, §1.1).
//   firstCollect: list → identity (athlete-list) → Wikidata (QID, birth, gender) → profile (Wikidata + Commons)
//                 → Wikipedia en text + revid → biography (Ollama) → auto-validation → profile.
//   update:       compares the Wikipedia revid with the last biography input; unchanged pages never reach Ollama.
import { type Database, selectRows } from '@was/db';
import { wikipediaApiUrl, wikipediaPageUrl } from '@was/shared';
import { sql } from 'drizzle-orm';

import { CanonicalWriter } from './canonical/canonical-writer';
import type { AiProvider } from './enrich/ai-provider.interface';
import type { EnrichItem } from './enrich/enrich-item.interface';
import { runBiography } from './enrich/run-biography.service';
import type { ArticlePerson } from './interfaces/article-person.interface';
import type { CollectReport } from './interfaces/collect-report.interface';
import { ATHLETE_LIST_PROVIDER } from './providers/athlete-list.const';
import { runAthleteList } from './providers/athlete-list.provider';
import type { IngestContext } from './providers/ingest-context.interface';
import type { ListEntry } from './providers/list-entry.interface';
import { WIKIDATA_PROVIDER } from './providers/wikidata.const';
import { runWikidata } from './providers/wikidata.provider';
import { WIKIDATA_PROFILE_PROVIDER } from './providers/wikidata-profile.const';
import { runWikidataProfile } from './providers/wikidata-profile.provider';

/**
 * Athletes with an English Wikipedia article; optionally only `ids`, one `slug`, at most `limit`. `priority` orders public
 * profiles first, then the highest champion tier (bulk collection spends the model on the athletes readers see first).
 */
export const peopleWithArticle = async (
  db: Database,
  ids: string[] | null,
  opts: { slug?: string | undefined; limit?: number | undefined; priority?: boolean | undefined } = {},
) =>
  await selectRows<ArticlePerson>(
    db,
    sql`
    select a.id, a.known_as name, a.full_name, a.birth_date, a.height_cm, x.external_id title
    from athletes a join entity_external_ids x on x.entity_id = a.id and x.provider = 'wikipedia_en' and x.deleted_at is null and x.is_current
    left join competitors c on c.id = a.id
    left join champion_tiers t on t.id = a.champion_tier_id
    where a.deleted_at is null ${
      ids
        ? sql`and a.id in (${sql.join(
            ids.map((i) => sql`${i}`),
            sql`, `,
          )})`
        : sql``
    }${opts.slug ? sql` and a.slug = ${opts.slug}` : sql``}${
      opts.priority ? sql` order by (c.profile_visibility = 'public') desc, t.sort_order desc nulls last, a.known_as` : sql``
    }${opts.limit !== undefined ? sql` limit ${opts.limit}` : sql``}`,
  );

/** Facts from the database given to the biography prompt (titles, clubs, birth, height). */
export const factsOf = async (db: Database, p: ArticlePerson) => {
  const titles = await selectRows<{ name: string; year: number }>(
    db,
    sql`
    select coalesce(t.name, d.slug) name, g.year from recognition_grants g join recognition_definitions d on d.id = g.definition_id
    left join recognition_definition_translations t on t.definition_id = d.id and t.locale = 'en' where g.competitor_id = ${p.id} and g.deleted_at is null order by g.year`,
  );
  const clubs = await selectRows<{ name: string; from_year: number | null; to_year: number | null }>(
    db,
    sql`select t.name, m.from_year, m.to_year from competitor_memberships m join teams t on t.id = m.parent_id where m.member_id = ${p.id} and m.deleted_at is null order by m.from_year`,
  );
  return [
    p.full_name && `full name ${p.full_name}`,
    p.birth_date && `born ${p.birth_date}`,
    p.height_cm && `height ${p.height_cm} cm`,
    titles.length && `titles: ${titles.map((t) => `${t.name} ${t.year}`).join(', ')}`,
    clubs.length && `teams: ${clubs.map((c) => `${c.name} (${c.from_year ?? '?'}–${c.to_year ?? '?'})`).join(', ')}`,
  ]
    .filter(Boolean)
    .join('; ');
};

/** Current revid of each article (50 per request, no text). */
const currentRevisions = async (ctx: IngestContext, titles: string[]) => {
  const out = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 50) {
    const url = wikipediaApiUrl('en', {
      action: 'query',
      prop: 'revisions',
      rvprop: 'ids',
      titles: titles.slice(i, i + 50).join('|'),
      format: 'json',
      formatversion: '2',
    });
    const doc = await ctx.document('wikipedia-en', url);
    if (!doc) continue;
    for (const pg of (JSON.parse(doc.text) as { query?: { pages?: { title: string; revisions?: { revid: number }[] }[] } }).query?.pages ?? [])
      if (pg.revisions?.[0]) out.set(pg.title, String(pg.revisions[0].revid));
  }
  return out;
};

/** Last revid each athlete's biography was generated from (`inputRef = <url>#rev:<revid>`). */
const lastBiographyRevisions = async (db: Database) =>
  new Map(
    (
      await selectRows<{ id: string; rev: string }>(
        db,
        sql`
    select distinct on (l.entity_id) l.entity_id id, split_part(i.input_ref, '#rev:', 2) rev
    from ai_invocations i join ai_extraction_queue q on q.invocation_id = i.id join source_links l on l.id = q.source_link_id
    where i.task = 'biography' and i.status = 'ok' order by l.entity_id, i.created_at desc`,
      )
    ).map((r) => [r.id, r.rev]),
  );

/**
 * AI input of one athlete: the article's plain text (Wikipedia en), its URL and the database facts; `null` without an
 * extract. `sectionKey` defaults to `rev:<revid>` (what the update mode compares); `pnpm ingest enrich` passes `article`.
 */
export const enrichItemOf = async (ctx: IngestContext, p: ArticlePerson, sectionKey?: string): Promise<EnrichItem | null> => {
  const url = wikipediaApiUrl('en', {
    action: 'query',
    prop: 'extracts|revisions',
    rvprop: 'ids',
    explaintext: '1',
    redirects: '1',
    titles: p.title,
    format: 'json',
    formatversion: '2',
  });
  const doc = await ctx.document('wikipedia-en', url);
  const page = doc && (JSON.parse(doc.text) as { query?: { pages?: { extract?: string; revisions?: { revid: number }[] }[] } }).query?.pages?.[0];
  if (!page?.extract) return null;
  return {
    entityId: p.id,
    name: p.name,
    sourceText: page.extract,
    sourceUrl: wikipediaPageUrl('en', p.title),
    sectionKey: sectionKey ?? `rev:${page.revisions?.[0]?.revid ?? ''}`,
    facts: await factsOf(ctx.db, p),
  };
};

type BiographyTotals = NonNullable<Awaited<ReturnType<typeof runBiography>>>;
const addTotals = (a: BiographyTotals, b: BiographyTotals): BiographyTotals => ({
  skipped: a.skipped && b.skipped,
  invocations: a.invocations + b.invocations,
  unchanged: a.unchanged + b.unchanged,
  accepted: a.accepted + b.accepted,
  proposals: a.proposals + b.proposals,
  rejected: a.rejected + b.rejected,
});

/**
 * Biographies one athlete at a time: each result is stored before the next article is fetched, so an interrupted run
 * (reboot, container restart) keeps everything done so far and the next run skips it by revision.
 */
const biographies = async (ctx: IngestContext, provider: AiProvider | null, people: ArticlePerson[]) => {
  if (!provider) return null;
  let totals: BiographyTotals = { skipped: false, invocations: 0, unchanged: 0, accepted: 0, proposals: 0, rejected: 0 };
  for (const [i, p] of people.entries()) {
    if (ctx.cancelled?.()) break; // cooperative cancel of the job
    const item = await enrichItemOf(ctx, p);
    if (!item) continue;
    // OLLAMA_CONCURRENCY=1: items run one after the other (the local model is the bottleneck).
    const r = await runBiography(ctx.db, provider, [item]);
    totals = addTotals(totals, r);
    const outcome = r.accepted ? 'accepted' : r.proposals ? 'queued' : r.rejected ? 'rejected' : r.unchanged ? 'unchanged' : 'no output';
    ctx.log(`[${i + 1}/${people.length}] ${p.name}: ${outcome}`);
  }
  return totals;
};

/** People whose last biography was made from another revision of the article (or never): the only ones the model sees. */
const changedSinceLastBiography = async (ctx: IngestContext, people: ArticlePerson[]) => {
  const [current, last] = await Promise.all([
    currentRevisions(
      ctx,
      people.map((p) => p.title),
    ),
    lastBiographyRevisions(ctx.db),
  ]);
  return people.filter((p) => !last.has(p.id) || (current.get(p.title) ?? '') !== last.get(p.id));
};

const write = (db: Database, providers: string[]) => new CanonicalWriter(db).writeProviders(providers);

/** First collection of a list of athletes (names, links or CSV lines). */
export const firstCollect = async (
  ctx: IngestContext,
  provider: AiProvider | null,
  entries: ListEntry[],
  opts: { limit?: number | undefined; priority?: boolean | undefined } = {},
): Promise<CollectReport> => {
  const list = await runAthleteList(ctx, entries);
  ctx.log(`athlete-list: ${list.resolved} resolved, ${list.missing.length} without an unambiguous article`);
  await write(ctx.db, [ATHLETE_LIST_PROVIDER]);
  const wanted = new Set(list.titles);
  const people = (await peopleWithArticle(ctx.db, null, { priority: opts.priority })).filter((p) => wanted.has(p.title)).slice(0, opts.limit ?? 100_000);
  for (const l of await runWikidata(ctx, {})) ctx.log(l);
  await write(ctx.db, [WIKIDATA_PROVIDER]);
  for (const l of await runWikidataProfile(ctx, { entityIds: new Set(people.map((p) => p.id)) })) ctx.log(l);
  await write(ctx.db, [WIKIDATA_PROFILE_PROVIDER]);
  // A re-run of the same list (restart, resume) only sends people without a biography of the current revision.
  const changed = await changedSinceLastBiography(ctx, people);
  if (changed.length < people.length) ctx.log(`collect: ${people.length - changed.length} already have a biography of the current revision (skipped)`);
  const biography = await biographies(ctx, provider, changed);
  return {
    mode: 'first',
    people: people.length,
    missing: list.missing,
    biography,
    needsEnrichment: provider ? 0 : changed.length,
    skippedUnchanged: people.length - changed.length,
  };
};

/** Periodic update: only articles whose revid changed since their last biography reach the model. */
export const updateCollect = async (
  ctx: IngestContext,
  provider: AiProvider | null,
  opts: { limit?: number | undefined; priority?: boolean | undefined } = {},
): Promise<CollectReport> => {
  const people = (await peopleWithArticle(ctx.db, null, { priority: opts.priority })).slice(0, opts.limit ?? 100_000);
  for (const l of await runWikidataProfile(ctx, { entityIds: new Set(people.map((p) => p.id)) })) ctx.log(l);
  await write(ctx.db, [WIKIDATA_PROFILE_PROVIDER]);
  const changed = await changedSinceLastBiography(ctx, people);
  const biography = await biographies(ctx, provider, changed);
  return {
    mode: 'update',
    people: people.length,
    missing: [],
    biography,
    needsEnrichment: provider ? 0 : changed.length,
    skippedUnchanged: people.length - changed.length,
  };
};
