// pnpm ingest <command> [options] — manual CLI of the ingestion pipeline (handoff v3 §6.3, A03).
//   football [--only fifa-world-cup:2002,...] [--no-olympics]   discovery of champion squads, starters and titles
//   bjj [--only adcc:2019,...]                                  ADCC + IBJJF champions with year and division
//   olympics --sport swimming --list "List of Olympic medalists in swimming" [--year 2016]
//   wikidata [--limit 500]                                      QIDs, birth and gender through enwiki sitelinks
//   profiles [--limit N]                                        profile from Wikidata + Commons photo (bio, birthplace, clubs…)
//   write [--providers football-champions,bjj-champions,...]    canonical writer (identity + domain)
//   enqueue <provider> [--only …]                               queue a job; `worker` processes queued jobs
//   worker [--max N]                                            claims and runs job items (retries, dead-letter)
//   report                                                      counts per stage, last runs, AI usage
//   identity-eval                                               precision/recall of the identity thresholds
//   enrich [--limit 20]                                         optional AI extraction (OLLAMA_URL) → human queue
//   ai-report                                                   calls, tokens, latency, approvals per model × task
// Flags: --offline (crawler cache only, no network). PGlite is single-process: stop `pnpm dev` first.
import { createDatabase, findRepoRoot, ingestionRuns, loadRootEnv } from '@was/db';
import { desc, sql } from 'drizzle-orm';

import { CanonicalWriter } from '../canonical/canonical-writer';
import { aiReport, OllamaProvider, runEnrichment } from '../enrich/ai';
import { IDENTITY_SAMPLE } from '../identity/identity-sample';
import { IDENTITY_THRESHOLDS, scoreCandidate } from '../identity/resolver';
import { enqueueJob, runWorker } from '../jobs/queue';
import { BJJ_PROVIDER, runBjjChampions } from '../providers/bjj-champions.provider';
import { createContext, type IngestContext } from '../providers/context';
import { FOOTBALL_PROVIDER, runFootballChampions } from '../providers/football-champions.provider';
import { OLYMPIC_PROVIDER, runOlympicMedalists } from '../providers/olympic-medalists.provider';
import { runWikidata, WIKIDATA_PROVIDER } from '../providers/wikidata.provider';
import { runWikidataProfile, WIKIDATA_PROFILE_PROVIDER } from '../providers/wikidata-profile.provider';

const args = process.argv.slice(2);
const command = args[0] ?? 'report';
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] && !args[i + 1]!.startsWith('--') ? args[i + 1]! : 'true') : undefined;
};
const list = (name: string) => flag(name)?.split(',').filter(Boolean);

loadRootEnv(findRepoRoot());
const handle = await createDatabase({ databaseUrl: process.env.DATABASE_URL, pgliteDataDir: process.env.PGLITE_DATA_DIR });
await handle.migrate();
const db = handle.db;
const log = (m: string) => console.log(m);
const ctx: IngestContext = createContext(db, { offline: flag('offline') === 'true', log });

/** Discovery handlers by provider: the same functions run from the CLI and from queued jobs. */
const discovery: Record<string, (c: IngestContext, params: Record<string, unknown>) => Promise<string[]>> = {
  [FOOTBALL_PROVIDER]: (c, p) => runFootballChampions(c, { only: p.only as string[] | undefined, olympics: p.olympics !== false }),
  [BJJ_PROVIDER]: (c, p) => runBjjChampions(c, { only: p.only as string[] | undefined }),
  [OLYMPIC_PROVIDER]: (c, p) => runOlympicMedalists(c, { sport: String(p.sport), listTitle: String(p.list), year: p.year ? Number(p.year) : undefined }),
  [WIKIDATA_PROVIDER]: (c, p) => runWikidata(c, { limit: p.limit ? Number(p.limit) : undefined }),
  [WIKIDATA_PROFILE_PROVIDER]: (c, p) => runWikidataProfile(c, { limit: p.limit ? Number(p.limit) : undefined }),
};
const write = async (providers: string[]) => {
  const report = await new CanonicalWriter(db).writeProviders(providers);
  log(`canonical: ${JSON.stringify(report)}`);
};

try {
  if (command === 'football') {
    (await discovery[FOOTBALL_PROVIDER]!(ctx, { only: list('only'), olympics: flag('no-olympics') !== 'true' })).forEach((l) => log(l));
    await write([FOOTBALL_PROVIDER]);
  } else if (command === 'bjj') {
    (await discovery[BJJ_PROVIDER]!(ctx, { only: list('only') })).forEach((l) => log(l));
    await write([BJJ_PROVIDER]);
  } else if (command === 'olympics') {
    (await discovery[OLYMPIC_PROVIDER]!(ctx, { sport: flag('sport'), list: flag('list'), year: flag('year') })).forEach((l) => log(l));
    await write([OLYMPIC_PROVIDER]);
  } else if (command === 'wikidata') {
    (await discovery[WIKIDATA_PROVIDER]!(ctx, { limit: flag('limit') })).forEach((l) => log(l));
    await write([WIKIDATA_PROVIDER]);
  } else if (command === 'profiles') {
    (await discovery[WIKIDATA_PROFILE_PROVIDER]!(ctx, { limit: flag('limit') })).forEach((l) => log(l));
    await write([WIKIDATA_PROFILE_PROVIDER]);
  } else if (command === 'write') {
    await write(list('providers') ?? Object.keys(discovery));
  } else if (command === 'enqueue') {
    const provider = args[1]!;
    if (!discovery[provider]) throw new Error(`unknown provider ${provider}`);
    const params = { only: list('only'), sport: flag('sport'), list: flag('list'), year: flag('year') };
    const { run, created } = await enqueueJob(db, { jobKey: provider, params, items: [{ key: 'discover' }, { key: 'write' }], mode: 'cli' });
    log(`${created ? 'queued' : 'already running'}: ${run.id} (${provider})`);
  } else if (command === 'worker') {
    const processed = await runWorker(
      db,
      Object.fromEntries(Object.entries(discovery).map(([key, fn]) => [key, async (item, run) => {
        if (item.itemKey === 'discover') return { report: await fn(createContext(db, { jobId: run.id, offline: flag('offline') === 'true', log }), run.params) };
        await write([key]);
      }])),
      { maxItems: flag('max') ? Number(flag('max')) : undefined },
    );
    log(`worker: ${processed} item(s) processed`);
  } else if (command === 'report') {
    const counts = (await db.execute(sql`
      select 'documents' k, count(*)::int n from source_documents union all select 'payloads', count(*) from source_payloads
      union all select 'observations', count(*) from source_observations union all select 'identity candidates (pending)', count(*) from identity_candidates where status = 'pending'
      union all select 'people', count(*) from athletes where deleted_at is null union all select 'public profiles', count(*) from competitors where kind = 'person' and profile_visibility = 'public'
      union all select 'entries', count(*) from competition_entries union all select 'squad members', count(*) from entry_members
      union all select 'results', count(*) from competition_results union all select 'grants', count(*) from recognition_grants
      union all select 'conflicts (pending)', count(*) from field_conflicts where resolution = 'pending'
      union all select 'dead job items', count(*) from ingestion_job_items where status = 'dead'`)) as unknown as { rows: { k: string; n: number }[] };
    for (const r of counts.rows) log(`${r.k.padEnd(32)} ${String(r.n).padStart(7)}`);
    for (const r of await db.select().from(ingestionRuns).orderBy(desc(ingestionRuns.startedAt)).limit(5)) log(`run ${r.jobKey} ${r.status} ${r.startedAt.toISOString()} checked=${r.checked} errors=${r.errors}`);
  } else if (command === 'enrich') {
    // Optional AI layer: needs OLLAMA_URL (+ OLLAMA_MODEL). Without it the pipeline goes on without enrichment.
    const provider = OllamaProvider.fromEnv();
    if (!provider) log('enrich: OLLAMA_URL not set: skipped (the deterministic pipeline does not depend on it)');
    const people = (await db.execute(sql`select x.entity_id id, x.external_id title, a.known_as name from entity_external_ids x join athletes a on a.id = x.entity_id where x.provider = 'wikipedia_en' and x.deleted_at is null limit ${Number(flag('limit') ?? 20)}`)) as unknown as { rows: { id: string; title: string; name: string }[] };
    const items = [];
    for (const p of provider ? people.rows : []) {
      const page = await ctx.wiki(p.title);
      if (page) items.push({ entityId: p.id, name: p.name, sourceText: page.text.split(/\n==/)[0] ?? page.text, sourceUrl: page.url, sectionKey: 'lead' });
    }
    log(`enrich: ${JSON.stringify(await runEnrichment(db, provider, items))}`);
  } else if (command === 'ai-report') {
    for (const r of await aiReport(db)) log(JSON.stringify(r));
  } else if (command === 'identity-eval') {
    for (const t of [0.9, 0.95, IDENTITY_THRESHOLDS.auto, 0.99]) {
      const r = IDENTITY_SAMPLE.map((s) => ({ s, score: scoreCandidate(s.query, s.candidate) }));
      const fp = r.filter((x) => !x.s.same && x.score >= t).length;
      const fn = r.filter((x) => x.s.same && x.score < IDENTITY_THRESHOLDS.review).length;
      const autoTp = r.filter((x) => x.s.same && x.score >= t).length;
      const review = r.filter((x) => x.score >= IDENTITY_THRESHOLDS.review && x.score < t).length;
      const same = r.filter((x) => x.s.same).length;
      log(`auto ≥ ${t}: precision ${(autoTp / Math.max(1, autoTp + fp)).toFixed(2)} · false positives ${fp} · recall (auto+review) ${((same - fn) / same).toFixed(2)} · false negatives ${fn} · manual review ${review}/${r.length}`);
    }
  } else {
    throw new Error(`unknown command ${command}`);
  }
} finally {
  await handle.close();
}
