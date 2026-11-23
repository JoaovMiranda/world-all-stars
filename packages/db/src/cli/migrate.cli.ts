// pnpm db:migrate — applies src/migrations to DATABASE_URL (Postgres) or the PGlite dir (.data/pglite).
import type { CliOptions } from '../interfaces/cli-options.interface';
import { BaseCli } from './base.cli';

class MigrateCli extends BaseCli {
  constructor(options: CliOptions = {}) {
    // Migrates inside run(), after saying where.
    super({ ...options, migrate: false });
  }

  protected async run(): Promise<void> {
    this.log(`[db] migrating ${this.database.driver} at ${this.database.location}`);
    await this.database.migrate();
    this.log('[db] migrations applied');
  }
}

await new MigrateCli().start();
