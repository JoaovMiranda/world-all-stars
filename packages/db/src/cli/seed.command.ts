import { findRepoRoot } from '../helpers/repo-root.helper';
import type { CliOptions } from '../interfaces/cli-options.interface';
import { seedDatabase } from '../seeds/seed';
import { BaseCli } from './base.cli';

/** `pnpm db:seed` (and the second half of `pnpm db:reset`): migrations + configuration + the prototype mock DB. */
export class SeedCli extends BaseCli {
  constructor(options: CliOptions = {}) {
    // Migrates inside run(), after saying where.
    super({ ...options, migrate: false });
  }

  protected async run(): Promise<void> {
    const started = Date.now();
    this.log(`[db] seeding ${this.database.driver} at ${this.database.location}`);
    await this.database.migrate();
    const report = await seedDatabase(this.db, findRepoRoot(), (m) => this.log(`[db] ${m}`));
    const rows = Object.entries(report.tables).sort(([a], [b]) => a.localeCompare(b));
    for (const [table, n] of rows) this.log(`  ${table.padEnd(32)} ${String(n).padStart(5)}`);
    this.log(`[db] seed done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
}
