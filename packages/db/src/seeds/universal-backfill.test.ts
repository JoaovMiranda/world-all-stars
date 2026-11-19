import fs from 'node:fs';
import path from 'node:path';

import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type DatabaseHandle, findRepoRoot } from '../client';
import { seedDatabase } from './seed';

const root = findRepoRoot();
const hasPrototype = fs.existsSync(path.join(root, 'plan/front-prototype/mock'));
const n = async (h: DatabaseHandle, query: string) => ((await h.db.execute(sql.raw(query))) as unknown as { rows: { n: number }[] }).rows[0]!.n;

describe.skipIf(!hasPrototype)('universal model backfill (handoff v3 §4)', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    await seedDatabase(h.db, root);
  });
  afterAll(() => h.close());

  it('registers every catalog entity once, with the same id (competitor-first)', async () => {
    expect(await n(h, 'select count(*)::int n from athletes a left join competitors c on c.id = a.id where c.id is null')).toBe(0);
    expect(await n(h, 'select count(*)::int n from teams t left join competitors c on c.id = t.id where c.id is null')).toBe(0);
    expect(await n(h, "select count(*)::int n from competitors where kind = 'person'")).toBe(await n(h, 'select count(*)::int n from athletes'));
    for (const table of ['sports', 'competitions', 'organizations', 'competition_editions', 'countries', 'competitors', 'recognition_definitions', 'competition_events']) {
      expect(await n(h, `select count(*)::int n from ${table} x left join entity_registry r on r.id = x.id where r.id is null`), table).toBe(0);
    }
  });

  it('turns every legacy achievement into a recognition grant and every reign into a holding', async () => {
    expect(await n(h, 'select count(*)::int n from recognition_grants')).toBe(await n(h, 'select count(*)::int n from achievements'));
    expect(await n(h, 'select count(*)::int n from title_holdings')).toBe(await n(h, 'select count(*)::int n from title_reigns'));
    expect(await n(h, 'select count(*)::int n from competitor_representations')).toBe(await n(h, 'select count(*)::int n from athlete_nationalities'));
    expect(await n(h, 'select count(*)::int n from competitor_memberships')).toBe(await n(h, 'select count(*)::int n from athlete_teams'));
    // Competition achievements also became entries + results of an event of their edition.
    expect(await n(h, 'select count(*)::int n from recognition_grants where result_id is not null')).toBeGreaterThan(0);
  });

  it('stores catalog content in English with pt-BR/es as translations, and redirects the old slugs', async () => {
    expect(await n(h, "select count(*)::int n from sports where slug in ('futebol','natacao','xadrez')")).toBe(0);
    expect(await n(h, "select count(*)::int n from sports where slug in ('football','swimming','chess')")).toBe(3);
    expect(await n(h, "select count(*)::int n from competition_translations where locale = 'en'")).toBe(await n(h, 'select count(*)::int n from competitions'));
    expect(await n(h, "select count(*)::int n from slug_redirects where old_slug = 'futebol'")).toBe(1);
    expect(await n(h, "select count(*)::int n from teams where name like 'Seleção%'")).toBe(0);
  });

  it('seeds the sports catalog: one sport per entry, disciplines linked, programmes as data (§11.5)', async () => {
    const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog/sports.catalog.json'), 'utf8')) as { sports: { slug: string }[] };
    const slugs = catalog.sports.map((s) => `'${s.slug}'`).join(',');
    expect(await n(h, `select count(distinct slug)::int n from sports where deleted_at is null and slug in (${slugs})`)).toBe(catalog.sports.length);
    expect(await n(h, "select count(*)::int n from sports where slug = 'football'")).toBe(1);
    expect(await n(h, "select count(*)::int n from sport_relations r join sports s on s.id = r.from_sport_id where s.slug = 'cycling-bmx-racing'")).toBe(1);
    expect(await n(h, "select count(*)::int n from competition_program_sports p join competitions c on c.id = p.competition_id where c.slug = 'olympic-games-summer'")).toBeGreaterThan(40);
    expect(await n(h, "select count(*)::int n from competitions where is_multi_sport and sport_id is null")).toBeGreaterThanOrEqual(7);
  });

  it('is idempotent', async () => {
    const before = await n(h, 'select (select count(*) from recognition_grants) + (select count(*) from entity_aliases) + (select count(*) from competition_results) + (select count(*) from domain_values)::int n');
    await seedDatabase(h.db, root);
    expect(await n(h, 'select (select count(*) from recognition_grants) + (select count(*) from entity_aliases) + (select count(*) from competition_results) + (select count(*) from domain_values)::int n')).toBe(before);
  });
});
