// pnpm db:cleanup — deletes expired auth sessions/verifications and rate-limit windows (for cron; the server also
// runs it every CLEANUP_INTERVAL_MINUTES). PGlite is single-process: on the local .data/pglite, stop the server first.
import { createDatabase } from '../client';
import { cleanupExpired } from '../maintenance/cleanup-expired';
import { databaseOptionsFromEnv } from './env.helper';

const handle = await createDatabase(databaseOptionsFromEnv());
const report = await cleanupExpired(handle.db);
await handle.close();
console.log(`[db] cleanup on ${handle.driver} at ${handle.location}:`, report);
