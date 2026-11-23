// pnpm db:seed — migrations + configuration + the prototype mock DB (plan/front-prototype). Idempotent.
// PGlite is single-process: stop the server (pnpm dev) before seeding the same .data/pglite.
import { createDatabase } from '../client';
import { findRepoRoot } from '../helpers/repo-root.helper';
import { seedDatabase } from '../seeds/seed';
import { databaseOptionsFromEnv } from './env.helper';

const started = Date.now();
const handle = await createDatabase(databaseOptionsFromEnv());
console.log(`[db] seeding ${handle.driver} at ${handle.location}`);
await handle.migrate();
const report = await seedDatabase(handle.db, findRepoRoot(), (m) => console.log(`[db] ${m}`));
await handle.close();
const rows = Object.entries(report.tables).sort(([a], [b]) => a.localeCompare(b));
for (const [table, n] of rows) console.log(`  ${table.padEnd(32)} ${String(n).padStart(5)}`);
console.log(`[db] seed done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
