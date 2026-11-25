// Cross-sport bands (T2.6) and legacy levels (T2.7) over the seeded database, through the real routes.
import { athletes, greatsDossiers } from '@was/db';
import { CrossSportApi } from '@was/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HAS_PROTOTYPE } from '../../test/test-app.const';
import { createTestApp } from '../../test/test-app.helper';
import type { TestApp } from '../../test/test-app.interface';

describe.skipIf(!HAS_PROTOTYPE)('cross-sport bands and legacy levels (seeded database)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  }, 120_000);
  afterAll(() => t.close());

  it('serves /api/rankings/all-sports (not shadowed by /api/rankings/:id), grouped S→D', async () => {
    const res = await t.call(CrossSportApi.list);
    expect(res.status).toBe(200);
    expect(res.json.groups.map((g: { band: string }) => g.band)).toEqual(['S', 'A', 'B', 'C', 'D']);
    expect(res.json.rulesetVersion).toBe('cross-sport@1');
  });

  it('is reproducible: two runs over the same data give the same hashes', async () => {
    const a = await t.call(CrossSportApi.methodology);
    const b = await t.call(CrossSportApi.methodology);
    expect(a.json.outputHash).toBe(b.json.outputHash);
    expect(a.json.inputHash).toBe(b.json.inputHash);
    expect(a.json.rulesets.length).toBeGreaterThan(0);
  });

  it('filters keep every entry inside the filter and never change the run hash', async () => {
    const all = await t.call(CrossSportApi.list);
    const sport = all.json.sports[0]?.slug as string | undefined;
    if (!sport) return;
    const filtered = await t.call(CrossSportApi.list, { query: { sport } });
    expect(filtered.json.outputHash).toBe(all.json.outputHash);
    for (const g of filtered.json.groups) for (const e of g.entries) expect(e.sports.map((s: { slug: string }) => s.slug)).toContain(sport);
  });

  it('unmapped competitive facts are an admin review list (typed error), not a silent zero', async () => {
    expect((await t.call(CrossSportApi.unmapped)).status).toBe(401);
    const res = await t.call(CrossSportApi.unmapped, {}, 'admin');
    expect(res.status).toBe(200);
    const list = await t.call(CrossSportApi.list);
    expect(res.json.total).toBe(list.json.unmappedTotal);
    for (const item of res.json.items) expect(item.error).toContain('No cross-sport mapping');
  });

  it('athlete band and legacy readouts; 404 for an unknown athlete', async () => {
    const band = await t.call(CrossSportApi.athleteBand, { params: { slug: 'pele' } });
    expect(band.status).toBe(200);
    const legacy = await t.call(CrossSportApi.athleteLegacy, { params: { slug: 'pele' } });
    expect(legacy.status).toBe(200);
    expect(legacy.json.rulesetVersion).toBe('legacy@1');
    expect((await t.call(CrossSportApi.athleteBand, { params: { slug: 'nobody' } })).status).toBe(404);
    expect((await t.call(CrossSportApi.athleteLegacy, { params: { slug: 'nobody' } })).status).toBe(404);
  });

  it('L5 needs an approved dossier, and the dossier never alters the band', async () => {
    const [pele] = await t.deps.db.select().from(athletes).where(eq(athletes.slug, 'pele'));
    const bandBefore = await t.call(CrossSportApi.athleteBand, { params: { slug: 'pele' } });
    const [existing] = await t.deps.db.select().from(greatsDossiers).where(eq(greatsDossiers.athleteId, pele!.id));
    if (existing) await t.deps.db.update(greatsDossiers).set({ status: 'pending' }).where(eq(greatsDossiers.id, existing.id));
    else
      await t.deps.db.insert(greatsDossiers).values({ id: '00000000-0000-7000-8000-0000000c5001', createdVia: 'test', athleteId: pele!.id, status: 'pending' });
    const pending = await t.call(CrossSportApi.athleteLegacy, { params: { slug: 'pele' } });
    expect(pending.json.level).not.toBe('L5');
    await t.deps.db.update(greatsDossiers).set({ status: 'approved' }).where(eq(greatsDossiers.athleteId, pele!.id));
    const approved = await t.call(CrossSportApi.athleteLegacy, { params: { slug: 'pele' } });
    expect(approved.json.dossierStatus).toBe('approved');
    expect(approved.json.level === 'L5').toBe(approved.json.score >= approved.json.l5Threshold);
    const bandAfter = await t.call(CrossSportApi.athleteBand, { params: { slug: 'pele' } });
    expect(bandAfter.json).toEqual(bandBefore.json);
  });
});
