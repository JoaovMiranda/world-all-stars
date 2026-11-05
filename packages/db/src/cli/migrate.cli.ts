// pnpm db:migrate — applies src/migrations to DATABASE_URL (Postgres) or the PGlite dir (.data/pglite).
import { createDatabase } from '../client';
import { databaseOptionsFromEnv } from './env.helper';

const handle = await createDatabase(databaseOptionsFromEnv());
console.log(`[db] migrating ${handle.driver} at ${handle.location}`);
await handle.migrate();
await handle.close();
console.log('[db] migrations applied');
