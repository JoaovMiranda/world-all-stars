// Real ingestion from the admin (A2 "run now", handoff v3 §6.3): the job is queued in Postgres and an in-process
// worker drains it in the background (the request never waits for the crawl). Job keys of the prototype map to the
// provider that replaces them; a key without a provider keeps the simulated run (said explicitly in its log).
import { type BaseRepository, type Database } from '@was/db';
import { BJJ_PROVIDER, CanonicalWriter, createContext, enqueueJob, FOOTBALL_PROVIDER, runBjjChampions, runFootballChampions, runWikidata, runWorker, WIKIDATA_PROVIDER } from '@was/ingest';

/** Admin job key → provider. */
export const PROVIDER_OF_JOB: Record<string, string> = {
  'wikidata.athletes': WIKIDATA_PROVIDER, [WIKIDATA_PROVIDER]: WIKIDATA_PROVIDER,
  'football.rsssf': FOOTBALL_PROVIDER, [FOOTBALL_PROVIDER]: FOOTBALL_PROVIDER,
  [BJJ_PROVIDER]: BJJ_PROVIDER,
};

const DISCOVERY: Record<string, (ctx: ReturnType<typeof createContext>) => Promise<string[]>> = {
  [FOOTBALL_PROVIDER]: (ctx) => runFootballChampions(ctx),
  [BJJ_PROVIDER]: (ctx) => runBjjChampions(ctx),
  [WIKIDATA_PROVIDER]: (ctx) => runWikidata(ctx),
};

let draining: Promise<unknown> | null = null;

/** Queues the provider's job (idempotent while it runs) and starts draining the queue in the background. */
export const startIngestion = async (db: Database, repo: BaseRepository, jobKey: string, requestedBy: string | null) => {
  const provider = PROVIDER_OF_JOB[jobKey];
  if (!provider) return null;
  const { run, created } = await enqueueJob(db, { jobKey: provider, params: {}, items: [{ key: 'discover' }, { key: 'write' }], requestedBy, mode: 'manual' });
  draining ??= runWorker(db, Object.fromEntries(Object.entries(DISCOVERY).map(([key, discover]) => [key, async (item, r) => {
    if (item.itemKey === 'discover') return { report: await discover(createContext(db, { jobId: r.id })) };
    return { report: await new CanonicalWriter(db, repo).writeProviders([key]) } as Record<string, unknown>;
  }])))
    .catch((error) => console.error('[ingest] worker failed', error))
    .finally(() => { draining = null; });
  return { runId: run.id, created };
};
