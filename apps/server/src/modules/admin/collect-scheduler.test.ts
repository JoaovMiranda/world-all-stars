// Fase 13 §1.4: the next scheduled collection is derived from ingestion_runs, so it survives a restart.
import { BaseRepository, createDatabase, type DatabaseHandle, ingestionRuns } from '@was/db';
import { uuidv7 } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CollectScheduler, nextScheduledCollect } from './collect.scheduler';

describe('collect scheduler', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
  });
  afterAll(() => h.close());

  it('is due right away when it never ran, and 6 months after the last scheduled update', async () => {
    expect((await nextScheduledCollect(h.db, 6)).getTime()).toBe(0);
    const at = new Date('2026-11-22T10:00:00Z');
    await h.db
      .insert(ingestionRuns)
      .values({ id: uuidv7(), createdVia: 'system:ingest', jobKey: 'collect.update', mode: 'scheduled', startedAt: at, status: 'success' } as never);
    // A new process (a restart) reads the same row.
    expect((await nextScheduledCollect(h.db, 6)).toISOString()).toBe('2027-05-22T10:00:00.000Z');
  });

  it('is off with INGEST_SCHEDULE_MONTHS=0 and starts/stops its timers otherwise', () => {
    const repo = new BaseRepository(h.db);
    const off = new CollectScheduler(h.db, repo, 0);
    expect(off.enabled).toBe(false);
    off.start();
    expect(off.started).toBe(false);
    const on = new CollectScheduler(h.db, repo, 6);
    const stop = on.start();
    expect(on.started).toBe(true);
    stop();
    expect(on.started).toBe(false);
  });
});
