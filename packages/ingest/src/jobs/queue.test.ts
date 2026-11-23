import { createDatabase, type DatabaseHandle, ingestionJobItems, ingestionRuns, selectRows } from '@was/db';
import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { backoffMs, cancelJob, claimItems, enqueueJob, runWorker } from './queue';

describe('job queue (A02/A04)', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
  });
  afterAll(() => h.close());

  it('enqueueing the same job twice returns the running one (idempotent)', async () => {
    const a = await enqueueJob(h.db, { jobKey: 'test', params: { edition: 2002 }, items: [{ key: 'a' }, { key: 'b' }] });
    const b = await enqueueJob(h.db, { jobKey: 'test', params: { edition: 2002 }, items: [{ key: 'a' }, { key: 'b' }] });
    expect(a.created).toBe(true);
    expect(b.created).toBe(false);
    expect(b.run.id).toBe(a.run.id);
    expect((await h.db.select().from(ingestionJobItems).where(eq(ingestionJobItems.runId, a.run.id))).length).toBe(2);
  });

  it("two workers never claim the same item; a dead worker's lease expires and the item resumes", async () => {
    const { run } = await enqueueJob(h.db, { jobKey: 'lease', params: {}, items: [{ key: 'x' }, { key: 'y' }, { key: 'z' }] });
    const w1 = await claimItems(h.db, 'w1', 2, 60_000, run.id);
    const w2 = await claimItems(h.db, 'w2', 2, 60_000, run.id);
    expect(new Set([...w1, ...w2].map((i) => i.id)).size).toBe(w1.length + w2.length);
    expect(w1.length + w2.length).toBe(3);
    // w1 dies: its lease is moved to the past; another worker takes the item back.
    await h.db
      .update(ingestionJobItems)
      .set({ lockedUntil: new Date(Date.now() - 1000) })
      .where(eq(ingestionJobItems.lockedBy, 'w1'));
    expect((await claimItems(h.db, 'w3', 5, 60_000, run.id)).length).toBe(w1.length);
  });

  it('retries with backoff, dead-letters after max attempts and closes the run as partial', async () => {
    const { run } = await enqueueJob(h.db, { jobKey: 'flaky', params: {}, items: [{ key: 'good' }, { key: 'bad' }] });
    await h.db.update(ingestionJobItems).set({ maxAttempts: 2 }).where(eq(ingestionJobItems.runId, run.id));
    const handlers = {
      flaky: async (item: { itemKey: string }) => {
        if (item.itemKey === 'bad') throw new Error('boom');
      },
    };
    await runWorker(h.db, handlers, { runId: run.id });
    await h.db
      .update(ingestionJobItems)
      .set({ nextAttemptAt: new Date(0) })
      .where(eq(ingestionJobItems.runId, run.id));
    await runWorker(h.db, handlers, { runId: run.id });
    const items = await h.db.select().from(ingestionJobItems).where(eq(ingestionJobItems.runId, run.id));
    expect(items.find((i) => i.itemKey === 'bad')?.status).toBe('dead');
    expect(items.find((i) => i.itemKey === 'good')?.status).toBe('done');
    const [closed] = await h.db.select().from(ingestionRuns).where(eq(ingestionRuns.id, run.id));
    expect(closed?.status).toBe('partial');
    expect(backoffMs(1, 1000, () => 0.5)).toBe(1000);
    expect(backoffMs(3, 1000, () => 0.5)).toBe(4000);
  });

  it('cancellation stops the remaining items', async () => {
    const { run } = await enqueueJob(h.db, { jobKey: 'cancel', params: {}, items: [{ key: '1' }, { key: '2' }] });
    await cancelJob(h.db, run.id);
    expect(await runWorker(h.db, { cancel: async () => undefined }, { runId: run.id })).toBe(0);
    const statuses = await selectRows<{ status: string }>(h.db, sql`select status from ingestion_job_items where run_id = ${run.id}`);
    expect(statuses.every((r) => r.status === 'cancelled')).toBe(true);
  });
});
