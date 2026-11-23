// Real ingestion from the admin (A2 "run now", handoff v3 §6.3): the job is queued in Postgres and an in-process
// worker drains it in the background (the request never waits for the crawl). Job keys of the prototype map to the
// provider that replaces them; a key without a provider keeps the simulated run (said explicitly in its log).
import type { BaseRepository, Database } from '@was/db';
import { CanonicalWriter, createContext, enqueueJob, runWorker, WIKIDATA_PROFILE_PROVIDER, WIKIDATA_PROVIDER } from '@was/ingest';

import { COLLECT, DISCOVERY, PROVIDER_OF_JOB } from './ingestion-runner.const';

let draining: Promise<unknown> | null = null;

/** Queues the provider's job (idempotent while it runs) and starts draining the queue in the background. */
export const startIngestion = async (
  db: Database,
  repo: BaseRepository,
  jobKey: string,
  requestedBy: string | null,
  params: Record<string, unknown> = {},
  mode: 'manual' | 'scheduled' = 'manual',
) => {
  const provider = PROVIDER_OF_JOB[jobKey];
  if (!provider) return null;
  const { run, created } = await enqueueJob(db, {
    jobKey: provider,
    params,
    items: COLLECT.has(provider) ? [{ key: 'discover' }] : [{ key: 'discover' }, { key: 'write' }],
    requestedBy,
    mode,
  });
  draining ??= runWorker(
    db,
    Object.fromEntries(
      Object.entries(DISCOVERY).map(([key, discover]) => [
        key,
        async (item, r) => {
          if (item.itemKey === 'discover')
            return { report: (await discover(createContext(db, { jobId: r.id }), (r.params ?? {}) as Record<string, unknown>)) as Record<string, unknown> };
          return { report: await new CanonicalWriter(db, repo).writeProviders(key === WIKIDATA_PROVIDER ? [key, WIKIDATA_PROFILE_PROVIDER] : [key]) } as Record<
            string,
            unknown
          >;
        },
      ]),
    ),
  )
    .catch((error) => console.error('[ingest] worker failed', error))
    .finally(() => {
      draining = null;
    });
  return { runId: run.id, created };
};
