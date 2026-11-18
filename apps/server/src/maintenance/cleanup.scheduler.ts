import { cleanupExpired, type Database } from '@was/db';

/**
 * Deletes expired auth sessions/verifications and rate-limit windows every `minutes` (CLEANUP_INTERVAL_MINUTES;
 * 0 = off). Started by main.ts only (tests never run it); the timer is unref'd so it never keeps the process alive.
 * Several instances may run it at once: the deletes are idempotent. Returns a stop function.
 */
export const startCleanupScheduler = (db: Database, minutes: number, log: (message: string) => void = console.log): (() => void) => {
  if (minutes <= 0) return () => {};
  const run = async () => {
    try {
      const report = await cleanupExpired(db);
      const total = report.authSessions + report.authVerifications + report.rateLimitBuckets;
      if (total > 0) log(`[cleanup] expired rows deleted: ${JSON.stringify(report)}`);
    } catch (error) {
      console.error('[cleanup] failed', error);
    }
  };
  const timer = setInterval(() => void run(), minutes * 60_000);
  timer.unref();
  return () => clearInterval(timer);
};
