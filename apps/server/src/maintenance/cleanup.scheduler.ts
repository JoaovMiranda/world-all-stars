import { cleanupExpired, type Database } from '@was/db';

import { BaseScheduler } from '../core/base.scheduler';

/**
 * Deletes expired auth sessions/verifications and rate-limit windows every `minutes` (CLEANUP_INTERVAL_MINUTES;
 * 0 = off). Started by main.ts only (tests never run it); the timer is unref'd so it never keeps the process alive.
 * Several instances may run it at once: the deletes are idempotent.
 */
export class CleanupScheduler extends BaseScheduler {
  protected readonly name = 'cleanup';

  constructor(
    private readonly db: Database,
    private readonly minutes: number,
    log?: (message: string) => void,
  ) {
    super(log);
  }

  protected get intervalMs(): number {
    return this.minutes * 60_000;
  }

  protected async tick(): Promise<void> {
    const report = await cleanupExpired(this.db);
    const total = report.authSessions + report.authVerifications + report.rateLimitBuckets;
    if (total > 0) this.log(`[cleanup] expired rows deleted: ${JSON.stringify(report)}`);
  }
}
