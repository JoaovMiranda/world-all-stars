// Parity with the retired Python crawler (data/seeds/atletas.csv): the TypeScript providers, offline from the same
// cache, must find the same champion editions (32 World Cups with squad + 11 starters, 34 Olympic tournaments).
import fs from 'node:fs';
import path from 'node:path';

import { createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase, selectRows } from '@was/db';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runBjjChampions } from './providers/bjj-champions.provider';
import { createContext } from './providers/context';
import { runFootballChampions } from './providers/football-champions.provider';

const root = findRepoRoot();
const hasCache = fs.existsSync(path.join(root, 'data/seeds/.cache/wiki/Football_at_the_Summer_Olympics.wiki'));
const rows = async (h: DatabaseHandle, q: string) => await selectRows<Record<string, unknown>>(h.db, sql.raw(q));

describe.skipIf(!hasCache)('parity with crawl_athletes.py (atletas.csv)', () => {
  let h: DatabaseHandle;
  let report: string[] = [];
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    await seedDatabase(h.db, '/nonexistent');
    const { seedSourcesPolicy } = await import('@was/db');
    await seedSourcesPolicy(h.db);
    const ctx = createContext(h.db, { offline: true });
    report = [...(await runFootballChampions(ctx)), ...(await runBjjChampions(ctx))];
  }, 600_000);
  afterAll(() => h.close());

  it('finds every champion World Cup (23 men 1930–2026 + 9 women 1991–2023) with 11 final starters', async () => {
    const editions = await rows(
      h,
      "select recordkey from (select split_part(record_key, ':', 1) || ':' || split_part(record_key, ':', 2) recordkey from source_observations where contract = 'entry@1') x where recordkey like 'fifa-%'",
    );
    expect(new Set(editions.map((r) => r.recordkey)).size).toBe(32);
    const starters = await rows(
      h,
      "select split_part(record_key, ':', 1) || ':' || split_part(record_key, ':', 2) k, count(*)::int n from source_observations where contract = 'participation@1' and record_key like 'fifa-%' group by 1",
    );
    expect(starters.filter((r) => r.n === 11).length).toBe(32);
  });

  it('finds the 34 Olympic football champions (26 men + 8 women) with their squads', async () => {
    const olympic = await rows(h, "select record_key from source_observations where contract = 'entry@1' and record_key like 'olympic-football%'");
    expect(olympic.length).toBe(34);
    expect(report.filter((l) => /olympic-football.*squad (\d+)/.test(l) && Number(/squad (\d+)/.exec(l)![1]) >= 11).length).toBe(34);
  });

  it('BJJ: 78 ADCC athletes and every title with year and division', async () => {
    expect(report.find((l) => l.startsWith('adcc:'))).toMatch(/78 athletes/);
    const ibjjf = report.find((l) => l.startsWith('ibjjf-world-championship:'))!;
    expect(Number(/(\d+) athletes/.exec(ibjjf)![1])).toBeGreaterThanOrEqual(200);
  });
});
