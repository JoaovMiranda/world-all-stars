// Real ingestion from the admin (A2 "run now", handoff v3 §6.3): the job is queued in Postgres and an in-process
// worker drains it in the background (the request never waits for the crawl). Job keys of the prototype map to the
// provider that replaces them; a key without a provider keeps the simulated run (said explicitly in its log).
import { active, type BaseRepository, type Database, ingestionRuns } from '@was/db';
import { CanonicalWriter, createContext, enqueueJob, runWorker, WIKIDATA_PROFILE_PROVIDER, WIKIDATA_PROVIDER } from '@was/ingest';
import { and, desc, eq, inArray } from 'drizzle-orm';

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

/**
 * Fase 13 §1.3: every INGEST_SCHEDULE_MONTHS (default 6; 0 = off) runs `collect.update` then `collect.discovery`.
 * The next run is derived from the last scheduled run stored in ingestion_runs, so it survives a restart. Checked
 * hourly; the timer is unref'd. Returns a stop function.
 */
export const nextScheduledCollect = async (db: Database, months: number) => {
  const [last] = await db
    .select({ at: ingestionRuns.startedAt })
    .from(ingestionRuns)
    .where(active(ingestionRuns, and(inArray(ingestionRuns.jobKey, ['collect.update']), eq(ingestionRuns.mode, 'scheduled'))))
    .orderBy(desc(ingestionRuns.startedAt))
    .limit(1);
  if (!last) return new Date(0);
  const next = new Date(last.at);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const startCollectScheduler = (db: Database, repo: BaseRepository, months: number, log: (m: string) => void = console.log): (() => void) => {
  if (months <= 0) return () => {};
  const tick = async () => {
    try {
      if ((await nextScheduledCollect(db, months)) > new Date()) return;
      log('[collect] scheduled update + discovery');
      await startIngestion(db, repo, 'collect.update', null, {}, 'scheduled');
      await startIngestion(db, repo, 'collect.discovery', null, {}, 'scheduled');
    } catch (error) {
      console.error('[collect] scheduler failed', error);
    }
  };
  const timer = setInterval(() => void tick(), 3_600_000);
  timer.unref();
  setTimeout(() => void tick(), 60_000).unref();
  return () => clearInterval(timer);
};
