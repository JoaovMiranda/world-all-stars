import type { Database } from '../client';
import { seedConfig } from './config.seed';
import { type SeedReport, seedPrototype } from './prototype.seed';

/** `pnpm db:seed`: configuration enums + the prototype database (when plan/ is present), in one transaction. */
export const seedDatabase = async (db: Database, repoRoot: string, log: (msg: string) => void = () => undefined): Promise<SeedReport & { config: number }> =>
  db.transaction(async (tx) => {
    const t = tx as unknown as Database;
    const config = await seedConfig(t);
    log(`config: ${config} rows (competition levels, champion tiers)`);
    const report = await seedPrototype(t, repoRoot, log);
    if (report.skipped) log(report.skipped);
    return { ...report, config };
  });
