import { active, type BaseRepository, type Database, ingestionRuns } from '@was/db';
import { and, desc, eq, inArray } from 'drizzle-orm';

import { BaseScheduler } from '../../core/base.scheduler';
import { startIngestion } from './ingestion-runner';

/** Next due scheduled collection: `months` after the last scheduled `collect.update` run (epoch when it never ran). */
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

/**
 * Fase 13 §1.3: every INGEST_SCHEDULE_MONTHS (default 6; 0 = off) runs `collect.update` then `collect.discovery`.
 * The next run is derived from the last scheduled run stored in ingestion_runs, so it survives a restart. Checked
 * hourly, first after 60 s; the timers are unref'd.
 */
export class CollectScheduler extends BaseScheduler {
  protected readonly name = 'collect';

  constructor(
    private readonly db: Database,
    private readonly repo: BaseRepository,
    private readonly months: number,
    log?: (message: string) => void,
  ) {
    super(log);
  }

  protected get intervalMs(): number {
    return this.months > 0 ? 3_600_000 : 0;
  }

  protected override get initialDelayMs(): number {
    return 60_000;
  }

  protected async tick(): Promise<void> {
    if ((await nextScheduledCollect(this.db, this.months)) > new Date()) return;
    this.log('[collect] scheduled update + discovery');
    await startIngestion(this.db, this.repo, 'collect.update', null, {}, 'scheduled');
    await startIngestion(this.db, this.repo, 'collect.discovery', null, {}, 'scheduled');
  }
}
