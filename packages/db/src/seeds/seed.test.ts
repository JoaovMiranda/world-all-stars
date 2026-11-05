import fs from 'node:fs';
import path from 'node:path';

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type DatabaseHandle, findRepoRoot } from '../client';
import { seedDatabase } from './seed';

const root = findRepoRoot();
const hasPrototype = fs.existsSync(path.join(root, 'plan/front-prototype/mock'));
const COUNTED = ['athletes', 'users', 'tier_votes', 'comments', 'notifications', 'greats_dossier_approvals', 'competition_levels', 'champion_tiers', 'sport_translations'];

const counts = async (h: DatabaseHandle) =>
  Object.fromEntries(
    await Promise.all(COUNTED.map(async (t) => [t, ((await h.db.execute(sql.raw(`select count(*)::int as n from ${t}`))) as unknown as { rows: { n: number }[] }).rows[0]!.n])),
  );

describe('seed', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
  });
  afterAll(() => h.close());

  it('seeds the configuration even without plan/', async () => {
    await seedDatabase(h.db, '/nonexistent-repo');
    const c = await counts(h);
    expect(c.competition_levels).toBe(4);
    expect(c.champion_tiers).toBe(4);
  });

  it.skipIf(!hasPrototype)('loads the prototype and is idempotent', async () => {
    await seedDatabase(h.db, root);
    const first = await counts(h);
    expect(first.athletes).toBe(18);
    await seedDatabase(h.db, root);
    expect(await counts(h)).toEqual(first);
  });

  it('refuses physical DELETE (soft delete only)', async () => {
    const error = await h.db.execute(sql`delete from banned_words`).then(() => null, (e: Error & { cause?: Error }) => e);
    expect(String(error?.cause?.message ?? error?.message)).toMatch(/forbidden/i);
  });
});
