// Concurrency suite of the Postgres job queue on a real server (T1.9): skipped unless DATABASE_URL is set
// (scripts/test/start-test-postgres.sh). Each worker gets its own pool, as separate processes would.
import { type DatabaseHandle, ingestionJobItems, ingestionRuns, seedSourcesPolicy, selectRows } from '@was/db';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Test-only helper of @was/db (not part of its public API).
import { createFreshPostgres } from '../../../db/src/test/postgres.helper';
import { recordObservation, storeDocument } from '../documents/document-store';
import type { ItemHandler } from './item-handler.type';
import { claimItems, enqueueJob, finishRunIfDone, runWorker } from './queue';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const keys = (n: number, prefix = 'item') => Array.from({ length: n }, (_, i) => ({ key: `${prefix}-${i}` }));

describe.skipIf(!process.env.DATABASE_URL)('job queue concurrency on Postgres (T1.9)', () => {
  let pg: Awaited<ReturnType<typeof createFreshPostgres>>;
  const workers: DatabaseHandle[] = [];

  beforeAll(async () => {
    pg = await createFreshPostgres('queue');
    await seedSourcesPolicy(pg.db);
    for (let i = 0; i < 4; i++) workers.push(await pg.open(4));
  });
  afterAll(() => pg?.drop());

  it('two workers on the same job: every item is processed exactly once', async () => {
    const { run } = await enqueueJob(pg.db, { jobKey: 'same-job', params: { n: 40 }, items: keys(40) });
    const seen = new Map<string, string[]>();
    const handler =
      (worker: string): ItemHandler =>
      async (item) => {
        seen.set(item.itemKey, [...(seen.get(item.itemKey) ?? []), worker]);
        await sleep(5);
      };
    const processed = await Promise.all(
      ['w1', 'w2'].map((w, i) => runWorker(workers[i]!.db, { 'same-job': handler(w) }, { workerId: w, runId: run.id, batch: 3 })),
    );
    expect(processed[0]! + processed[1]!).toBe(40);
    expect(processed.every((p) => p > 0)).toBe(true); // both workers really competed
    expect(seen.size).toBe(40);
    expect([...seen.values()].every((by) => by.length === 1)).toBe(true);
    const items = await pg.db.select().from(ingestionJobItems).where(eq(ingestionJobItems.runId, run.id));
    expect(items.every((i) => i.status === 'done' && i.attempts === 1)).toBe(true);
    const [closed] = await pg.db.select().from(ingestionRuns).where(eq(ingestionRuns.id, run.id));
    expect(closed?.status).toBe('success');
  });

  it('simultaneous claims (FOR UPDATE SKIP LOCKED) never hand the same item to two workers', async () => {
    const { run } = await enqueueJob(pg.db, { jobKey: 'claim-race', params: {}, items: keys(30) });
    const claims = await Promise.all(Array.from({ length: 12 }, (_, i) => claimItems(workers[i % 4]!.db, `c${i}`, 4, 60_000, run.id)));
    const ids = claims.flat().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(30);
  });

  it('duplicate ingestion: re-enqueueing and re-ingesting the same job and documents keeps idempotent counts', async () => {
    const params = { edition: 2002 };
    const items = keys(10, 'doc');
    // The same job requested by several callers at once → never two runs (ingestion_runs_active_params_uq).
    const settled = await Promise.allSettled(workers.map((w) => enqueueJob(w.db, { jobKey: 'dup', params, items })));
    const enqueued = settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    expect(enqueued.filter((e) => e.created)).toHaveLength(1);
    const run = enqueued.find((e) => e.created)!.run;
    expect(new Set(enqueued.map((e) => e.run.id))).toEqual(new Set([run.id]));
    // Requested again later → the running one, same items.
    const again = await enqueueJob(pg.db, { jobKey: 'dup', params, items });
    expect(again.created).toBe(false);
    expect(again.run.id).toBe(run.id);
    // Two workers process the job; each item stores its document, then BOTH workers record the same observations
    // concurrently (as two overlapping runs re-parsing the same document would).
    const ingest: ItemHandler = async (item) => {
      const { document } = await storeDocument(pg.db, {
        sourceSlug: 'wikidata',
        url: `https://www.wikidata.org/wiki/${item.itemKey}`,
        revisionId: null,
        httpStatus: 200,
        contentType: 'text/plain',
        bytes: Buffer.from(`content of ${item.itemKey}`),
      });
      const observation = {
        documentId: document.id,
        providerKey: 'test',
        parserKey: 'test-parser',
        parserVersion: '1',
        recordKey: item.itemKey,
        informationKind: 'identity' as const,
        contract: 'test@1',
        extracted: { key: item.itemKey },
      };
      const both = await Promise.all(workers.slice(0, 2).map((w) => recordObservation(w.db, observation)));
      expect(new Set(both.map((o) => o.observation.id)).size).toBe(1);
    };
    await Promise.all(['d1', 'd2'].map((w, i) => runWorker(workers[i]!.db, { dup: ingest }, { workerId: w, runId: run.id })));
    // Re-run the whole ingestion once more (sequentially): nothing new.
    for (const item of await pg.db.select().from(ingestionJobItems).where(eq(ingestionJobItems.runId, run.id))) await ingest(item, run);
    const [counts] = await selectRows<{ runs: number; items: number; payloads: number; documents: number; observations: number }>(
      pg.db,
      sql`select
        (select count(*)::int from ingestion_runs where job_key = 'dup') runs,
        (select count(*)::int from ingestion_job_items where run_id = ${run.id}) items,
        (select count(*)::int from source_payloads) payloads,
        (select count(*)::int from source_documents) documents,
        (select count(*)::int from source_observations) observations`,
    );
    expect(counts).toEqual({ runs: 1, items: 10, payloads: 10, documents: 10, observations: 10 });
  });

  // KNOWN BUG (T1.9 report): enqueueJob is check-then-insert; when two callers enqueue the same job at once the
  // partial unique index keeps one run, but the losers get a raw unique violation instead of the running run.
  // Remove `.fails` once enqueueJob uses insert … on conflict do nothing + re-select.
  it('duplicate ingestion: every concurrent caller of the same job gets the running run', async () => {
    for (let i = 0; i < 5; i++) {
      const settled = await Promise.allSettled(workers.map((w) => enqueueJob(w.db, { jobKey: 'dup-race', params: { i }, items: keys(2) })));
      expect(settled.filter((r) => r.status === 'rejected')).toHaveLength(0);
    }
  });

  // KNOWN BUG (T1.9 report): storeDocument is check-then-insert. Two workers fetching the same page at the same time
  // store it twice when revision_id is null (the unique index treats NULLs as distinct) and the loser throws a raw
  // unique violation when it is not. Remove `.fails` once document-store uses insert … on conflict + NULLS NOT DISTINCT.
  it('duplicate ingestion: the same document fetched by two workers at once is stored once', async () => {
    const errors: unknown[] = [];
    for (const revisionId of [null, 'rev-1']) {
      for (let i = 0; i < 10; i++) {
        const input = {
          sourceSlug: 'wikidata',
          url: `https://www.wikidata.org/wiki/race-${i}`,
          revisionId,
          httpStatus: 200,
          contentType: 'text/plain',
          bytes: Buffer.from(`race ${i}`),
        };
        const results = await Promise.allSettled(workers.slice(0, 2).map((w) => storeDocument(w.db, input)));
        for (const r of results) if (r.status === 'rejected') errors.push(r.reason);
      }
    }
    const [row] = await selectRows<{ n: number }>(pg.db, sql`select count(*)::int n from source_documents where canonical_url like '%/race-%'`);
    expect({ errors: errors.length, documents: row!.n }).toEqual({ errors: 0, documents: 20 });
  });

  it('worker killed: its lease expires and another worker resumes the item', async () => {
    const { run } = await enqueueJob(pg.db, { jobKey: 'lease', params: {}, items: keys(3, 'lease') });
    // Worker A (its own pool = its own process) claims everything with a short lease, then dies before finishing.
    const doomed = await pg.open(2);
    const claimed = await claimItems(doomed.db, 'doomed', 10, 400, run.id);
    expect(claimed).toHaveLength(3);
    await doomed.close();
    // While the lease is valid nobody else can take the items.
    expect(await claimItems(workers[2]!.db, 'too-early', 10, 60_000, run.id)).toHaveLength(0);
    await sleep(600);
    // After expiry worker B resumes them (attempt 2) and the run closes.
    const resumed: string[] = [];
    const processed = await runWorker(workers[2]!.db, { lease: async (item) => void resumed.push(item.itemKey) }, { workerId: 'rescuer', runId: run.id });
    expect(processed).toBe(3);
    expect(resumed.sort()).toEqual(['lease-0', 'lease-1', 'lease-2']);
    const items = await pg.db.select().from(ingestionJobItems).where(eq(ingestionJobItems.runId, run.id));
    expect(items.every((i) => i.status === 'done' && i.attempts === 2 && i.lockedBy === null)).toBe(true);
    expect((await finishRunIfDone(pg.db, run.id))?.status).toBe('success');
  });
});
