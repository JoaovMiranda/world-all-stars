// pnpm db:reset — DESTROYS the local PGlite dir (.data/pglite) and recreates it (migrate + seed). Never touches DATABASE_URL.
import fs from 'node:fs';

import { DEFAULT_PGLITE_DIR } from '../consts/default-pglite-dir.const';
import { databaseOptionsFromEnv } from './env.helper';

const options = databaseOptionsFromEnv();
if (options.databaseUrl) {
  console.error('[db] reset only works on the local PGlite database (unset DATABASE_URL).');
  process.exit(1);
}
const dir = options.pgliteDataDir ?? DEFAULT_PGLITE_DIR();
fs.rmSync(dir, { recursive: true, force: true });
console.log(`[db] removed ${dir}`);
await import('./seed.cli');
