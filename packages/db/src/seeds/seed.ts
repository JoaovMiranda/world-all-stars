import type { SeedReport } from '../interfaces/seed-report.interface';
import type { Database } from '../types/database.type';
import { seedConfig } from './config.seed';
import { seedDomainVocabulary } from './domain.seed';
import { seedPrototype } from './prototype.seed';
import { seedSourcesPolicy } from './sources-policy.seed';
import { seedSportContent } from './sport-content.seed';
import { seedSportsCatalog } from './sports-catalog.seed';
import { backfillUniversalModel } from './universal-backfill.seed';

/** `pnpm db:seed`: configuration enums + the prototype database (when plan/ is present), in one transaction. */
export const seedDatabase = async (db: Database, repoRoot: string, log: (msg: string) => void = () => undefined): Promise<SeedReport & { config: number }> =>
  db.transaction(async (tx) => {
    const t = tx as unknown as Database;
    const config = await seedConfig(t);
    log(`config: ${config} rows (competition levels, champion tiers)`);
    const vocabulary = await seedDomainVocabulary(t);
    log(`domain vocabulary: ${vocabulary} values`);
    const report = await seedPrototype(t, repoRoot, log);
    if (report.skipped) log(report.skipped);
    const policies = await seedSourcesPolicy(t);
    log(`source policies: ${policies} sources`);
    const catalog = await seedSportsCatalog(t, repoRoot);
    if (catalog) log(`sports catalog: ${catalog.sports} sports/disciplines, ${catalog.programmes} programme entries`);
    const sections = await seedSportContent(t, repoRoot);
    if (sections) log(`sport content: ${sections} sections`);
    const backfill = await backfillUniversalModel(t);
    log(`universal model: ${Object.values(backfill).reduce((a, b) => a + b, 0)} rows`);
    Object.assign(report.tables, Object.fromEntries(Object.entries(backfill).map(([k, v]) => [k, (report.tables[k] ?? 0) + v])));
    return { ...report, config };
  });
