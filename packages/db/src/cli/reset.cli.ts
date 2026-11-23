// pnpm db:reset — DESTROYS the local PGlite dir (.data/pglite) and recreates it (migrate + seed). Never touches DATABASE_URL.
import fs from 'node:fs';

import { DEFAULT_PGLITE_DIR } from '../consts/default-pglite-dir.const';
import { loadRootEnv } from '../helpers/repo-root.helper';
import { SeedCli } from './seed.command';

class ResetCli extends SeedCli {
  /** Removes the PGlite dir BEFORE the database is opened, then seeds a fresh one (SeedCli). */
  override async main(): Promise<number> {
    if (this.env === process.env) loadRootEnv();
    const options = this.databaseOptions();
    if (options.databaseUrl) {
      console.error('[db] reset only works on the local PGlite database (unset DATABASE_URL).');
      return 1;
    }
    const dir = options.pgliteDataDir ?? DEFAULT_PGLITE_DIR();
    fs.rmSync(dir, { recursive: true, force: true });
    this.log(`[db] removed ${dir}`);
    return super.main();
  }
}

await new ResetCli().start();
