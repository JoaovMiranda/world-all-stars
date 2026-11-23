import fs from 'node:fs';
import path from 'node:path';

import { createDatabase, type DatabaseHandle, findRepoRoot, seedDatabase, selectRows } from '@was/db';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { CanonicalWriter } from './canonical/canonical-writer';
import { runBjjChampions } from './providers/bjj-champions.provider';
import { createContext } from './providers/context';
import { runFootballChampions } from './providers/football-champions.provider';

const root = findRepoRoot();
const hasCache = fs.existsSync(path.join(root, 'data/seeds/.cache/fjelstul/squads.csv'));
const n = async (h: DatabaseHandle, q: string) => (await selectRows<{ n: number }>(h.db, sql.raw(q)))[0]!.n;

describe.skipIf(!hasCache)('deterministic ingestion pilot (handoff v3 Phase 5): offline, from the crawler cache', () => {
  let h: DatabaseHandle;
  beforeAll(async () => {
    h = await createDatabase({ pgliteDataDir: 'memory://' });
    await h.migrate();
    await seedDatabase(h.db, root);
  }, 120_000);
  afterAll(() => h.close());

  const pilot = async () => {
    const ctx = createContext(h.db, { offline: true });
    await runFootballChampions(ctx, { only: ['fifa-world-cup:2002'], olympics: false });
    await runBjjChampions(ctx, { only: ['adcc:2019'] });
    return new CanonicalWriter(h.db).writeProviders(['football-champions', 'bjj-champions']);
  };

  it('2002 World Cup (Brazil) and ADCC 2019: observations → canonical squad, starters, titles', async () => {
    const report = await pilot();
    expect(report.people.created).toBeGreaterThan(20);
    // Brazil 2002: 23 registered members, 11 starters of the final, a title for the team and for every member.
    expect(
      await n(
        h,
        "select count(*)::int n from entry_members m join competition_entries e on e.id = m.entry_id join teams t on t.id = e.competitor_id where t.slug = 'brazil-men-football'",
      ),
    ).toBe(23);
    expect(await n(h, "select count(*)::int n from contest_participations p join contests c on c.id = p.contest_id where c.label = 'Final'")).toBe(11);
    expect(
      await n(
        h,
        "select count(*)::int n from recognition_grants g join recognition_definitions d on d.id = g.definition_id where d.slug = 'fifa-world-cup--championship_title' and g.year = 2002",
      ),
    ).toBe(24);
    // Squad from Fjelstul = verified; only starters get a public page (C02/F02).
    expect(await n(h, "select count(*)::int n from entry_members where verification = 'verified'")).toBe(23);
    expect(
      await n(h, "select count(*)::int n from competitors c join contest_participations p on p.person_id = c.id where c.profile_visibility = 'public'"),
    ).toBe(11);
    // ADCC 2019: every title has its own event with the division AS ADCC NAMES IT.
    expect(
      await n(
        h,
        "select count(*)::int n from competition_events ev join competition_editions ed on ed.id = ev.edition_id join competitions c on c.id = ed.competition_id where c.slug = 'adcc' and ed.year = 2019",
      ),
    ).toBeGreaterThanOrEqual(6);
    expect(await n(h, "select count(*)::int n from category_values where unit = 'kg'")).toBeGreaterThan(0);
    // Every canonical entry points back to an observation of a stored document.
    expect(
      await n(
        h,
        "select count(*)::int n from field_provenance fp join source_observations o on o.id = fp.observation_id join source_documents d on d.id = o.document_id where fp.entity_type = 'competition_entries'",
      ),
    ).toBeGreaterThan(0);
    // Gordon Ryan already existed? no: created once, with his ADCC titles as grants.
    expect(await n(h, "select count(*)::int n from athletes where known_as = 'Gordon Ryan'")).toBe(1);
  }, 180_000);

  it('is idempotent: running the pilot again changes no count (A04)', async () => {
    const tables = [
      'source_documents',
      'source_observations',
      'athletes',
      'entry_members',
      'competition_results',
      'recognition_grants',
      'contest_participations',
      'competition_events',
    ];
    const before = await Promise.all(tables.map((t) => n(h, `select count(*)::int n from ${t}`)));
    await pilot();
    expect(await Promise.all(tables.map((t) => n(h, `select count(*)::int n from ${t}`)))).toEqual(before);
  }, 180_000);
});
