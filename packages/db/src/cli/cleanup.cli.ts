// pnpm db:cleanup — deletes expired auth sessions/verifications and rate-limit windows (for cron; the server also
// runs it every CLEANUP_INTERVAL_MINUTES). PGlite is single-process: on the local .data/pglite, stop the server first.
import type { CliOptions } from '../interfaces/cli-options.interface';
import { cleanupExpired } from '../maintenance/cleanup-expired';
import { BaseCli } from './base.cli';

class CleanupCli extends BaseCli {
  constructor(options: CliOptions = {}) {
    // Maintenance only: never migrates.
    super({ ...options, migrate: false });
  }

  protected async run(): Promise<void> {
    const report = await cleanupExpired(this.db);
    console.log(`[db] cleanup on ${this.database.driver} at ${this.database.location}:`, report);
  }
}

await new CleanupCli().start();
