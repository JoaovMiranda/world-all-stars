// Shared rate-limit store (doc 05): fixed-window counters used by every server instance (the API buckets of
// RATE_LIMITS and Better Auth's limits). EPHEMERAL: no soft delete, no versioning; expired rows are physically
// deleted by the cleanup job (`pnpm db:cleanup` / the server scheduler), so the table is in forbid_delete_exempt.
import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';

import { timestamptz } from '../columns/base.column';

export const rateLimitBuckets = pgTable(
  'rate_limit_buckets',
  {
    /** `<bucket>:<user id | ip_hash>` (API) or `auth:<hash of Better Auth's ip|path key>`; never a raw IP. */
    key: text().primaryKey(),
    count: integer().notNull(),
    windowStart: timestamptz().notNull(),
    /** End of the window: the counter restarts after it and the cleanup deletes the row. */
    expiresAt: timestamptz().notNull(),
  },
  (t) => [index().on(t.expiresAt)],
);
