// pnpm rankings:calculate [methodology…] — calculates CANDIDATE snapshots (never publishes: two admins approve in
// the admin, handoff v3 §8). PGlite is single-process: stop `pnpm dev` first.
import { createDatabase, findRepoRoot, loadRootEnv } from '@was/db';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import { calculateRankings } from '../modules/rankings/rankings.service';

loadRootEnv(findRepoRoot());
const handle = await createDatabase({ databaseUrl: process.env.DATABASE_URL, pgliteDataDir: process.env.PGLITE_DATA_DIR });
await handle.migrate();
const { deps } = createApp({ db: handle.db, config: { ...loadConfig(process.env), logRequests: false } });
const methodologies = process.argv.slice(2).length ? process.argv.slice(2) : ['football-champions', 'bjj-career'];
try {
  for (const m of methodologies) console.log(`${m}: ${(await calculateRankings(deps, m, { userId: null, name: 'rankings cli', via: 'system:ranking' })).length} candidate snapshot(s)`);
} finally {
  await handle.close();
}
