// Deletes expired rows of the ephemeral tables (forbid_delete_exempt): Better Auth sessions and verification tokens
// (it only deletes them on demand, when one is read after expiry) and rate-limit windows that ended.
// Used by the server scheduler (CLEANUP_INTERVAL_MINUTES) and by `pnpm db:cleanup` (cron).
import { lt } from 'drizzle-orm';

import type { CleanupReport } from '../interfaces/cleanup-report.interface';
import { authSessions, authVerifications } from '../tables/auth.table';
import { rateLimitBuckets } from '../tables/rate-limit.table';
import type { Database } from '../types/database.type';

export const cleanupExpired = async (db: Database, now: Date = new Date()): Promise<CleanupReport> => {
  const [sessions, verifications, buckets] = await Promise.all([
    db.delete(authSessions).where(lt(authSessions.expiresAt, now)).returning({ id: authSessions.id }),
    db.delete(authVerifications).where(lt(authVerifications.expiresAt, now)).returning({ id: authVerifications.id }),
    db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.expiresAt, now)).returning({ key: rateLimitBuckets.key }),
  ]);
  return { authSessions: sessions.length, authVerifications: verifications.length, rateLimitBuckets: buckets.length };
};
