// Contract conformance: every GET answers 200 with a body that the shared response schema accepts.
import { AdminApi, type ApiContract, ParticipationApi, PublicApi, RankingsApi } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { ALL_ROUTES } from '../routes.const';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';

const ALL_CONTRACTS: ApiContract[] = [
  ...Object.values(PublicApi),
  ...Object.values(ParticipationApi),
  ...Object.values(AdminApi),
  ...Object.values(RankingsApi),
];

/** Input of each GET for the seeded database. */
const GET_INPUTS: Record<string, { params?: Record<string, string>; query?: Record<string, string> }> = {
  [PublicApi.home.path]: { query: { date: '2026-10-23' } },
  [PublicApi.athletes.path]: { query: { q: 'pel' } },
  [PublicApi.athleteProfile.path]: { params: { slug: 'pele' } },
  [PublicApi.compare.path]: { query: { slugs: 'pele,michael-phelps' } },
  [PublicApi.sportPage.path]: { params: { slug: 'football' } },
  [PublicApi.calendar.path]: { query: { from: '2026-01-01', to: '2026-12-31' } },
  [PublicApi.onThisDay.path]: { params: { md: '10-23' } },
  [ParticipationApi.tierVotes.path]: { params: { slug: 'pele' } },
  [ParticipationApi.comments.path]: { params: { slug: 'pele' } },
  [RankingsApi.athlete.path]: { params: { slug: 'pele' } },
};
const sessionFor = (c: ApiContract) => (c.access === 'admin' ? 'admin' : c.access === 'reader' ? 'reader' : 'anon') as 'anon' | 'reader' | 'admin';

describe('routes are generated from the shared contracts', () => {
  it('serves every contract exactly once', () => {
    const served = ALL_ROUTES.map((r) => `${r.contract.method} ${r.contract.path}`);
    expect(new Set(served).size).toBe(served.length);
    expect(served.sort()).toEqual(ALL_CONTRACTS.map((c) => `${c.method} ${c.path}`).sort());
  });
});

describe.skipIf(!HAS_PROTOTYPE)('GET conformance (seeded database)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  for (const contract of ALL_CONTRACTS.filter((c) => c.method === 'GET' && c !== RankingsApi.detail)) {
    it(`${contract.path} (${contract.access})`, async () => {
      const res = await t.call(contract, GET_INPUTS[contract.path] ?? {}, sessionFor(contract));
      expect(res.status, JSON.stringify(res.json)).toBe(200);
      expect(contract.response.safeParse(res.json).success).toBe(true);
    });
  }

  it('returns real data', async () => {
    const list = await t.call(PublicApi.athletes);
    expect(list.json.total).toBe(18);
    const pele = await t.call(PublicApi.athleteProfile, { params: { slug: 'pele' } });
    expect(pele.json.knownAs).toBe('Pelé');
    expect(pele.json.achievements.length).toBeGreaterThan(0);
    const home = await t.call(PublicApi.home, { query: { date: '2026-10-23' } });
    // The sports catalog (handoff v3 §11.5) seeds every Olympic, World Games, Commonwealth, Asian Games and mind sport.
    expect(home.json.sports.length).toBeGreaterThanOrEqual(140);
    expect(home.json.globe.length).toBeGreaterThan(0);
  });

  it('404 for an unknown athlete or sport', async () => {
    expect((await t.call(PublicApi.athleteProfile, { params: { slug: 'nobody' } })).status).toBe(404);
    expect((await t.call(PublicApi.sportPage, { params: { slug: 'nothing' } })).json.error).toBe('not_found');
  });
});

/**
 * Byte-level contract snapshots of the catalog read model (handoff T1.1): the JSON of every catalog-backed public GET
 * on the seeded database. Any change in the bytes fails; refresh only for an intended contract change (`vitest -u`).
 */
const SNAPSHOT_CALLS: [name: string, contract: ApiContract, input?: { params?: Record<string, string>; query?: Record<string, string> }][] = [
  ['home', PublicApi.home, { query: { date: '2026-10-23' } }],
  ['athletes', PublicApi.athletes],
  ['athletes-search', PublicApi.athletes, { query: { q: 'pel' } }],
  ['analysis-dimensions', PublicApi.analysisDimensions],
  ['compare', PublicApi.compare, { query: { slugs: 'pele,michael-phelps' } }],
  ['sports', PublicApi.sports],
  ['governance-models', PublicApi.governanceModels],
  ['organizations', PublicApi.organizations],
  ['hall-of-greats', PublicApi.hallOfGreats],
  ['sources', PublicApi.sources],
  ['calendar', PublicApi.calendar, { query: { from: '2026-01-01', to: '2026-12-31' } }],
  ['on-this-day', PublicApi.onThisDay, { params: { md: '10-23' } }],
  ['validation-context', PublicApi.validationContext],
];

describe.skipIf(!HAS_PROTOTYPE)('catalog contract snapshots (seeded database)', () => {
  let t: TestApp;
  beforeAll(async () => {
    // Career-length dimensions read the current year: pin the clock so the bytes do not drift with time.
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-10-23T12:00:00.000Z') });
    t = await createTestApp();
  });
  afterAll(async () => {
    vi.useRealTimers();
    await t.close();
  });
  const snapshot = (name: string) => `./__snapshots__/catalog/${name}.json`;
  const body = (json: unknown) => `${JSON.stringify(json, null, 2)}\n`;

  for (const [name, contract, input] of SNAPSHOT_CALLS) {
    it(`${contract.path} (${name})`, async () => {
      const res = await t.call(contract, input ?? {});
      expect(res.status).toBe(200);
      await expect(body(res.json)).toMatchFileSnapshot(snapshot(name));
    });
  }

  it('every athlete profile and every sport page', async () => {
    const list = await t.call(PublicApi.athletes);
    const profiles: Record<string, unknown> = {};
    for (const a of list.json.items as { slug: string }[]) profiles[a.slug] = (await t.call(PublicApi.athleteProfile, { params: { slug: a.slug } })).json;
    await expect(body(profiles)).toMatchFileSnapshot(snapshot('athlete-profiles'));
    await expect(body(profiles.pele)).toMatchFileSnapshot(snapshot('athlete-pele'));
    const sports = await t.call(PublicApi.sports);
    const pages: Record<string, unknown> = {};
    for (const g of sports.json as { subgroups: { sports: { slug: string }[] }[] }[])
      for (const sg of g.subgroups) for (const s of sg.sports) pages[s.slug] = (await t.call(PublicApi.sportPage, { params: { slug: s.slug } })).json;
    await expect(body(pages)).toMatchFileSnapshot(snapshot('sport-pages'));
  });
});

describe('empty database (no seed)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ seed: false });
  });
  afterAll(() => t.close());

  it('boots and answers public GETs', async () => {
    for (const contract of Object.values(PublicApi)) {
      const res = await t.call(contract, GET_INPUTS[contract.path] ?? {});
      if (contract === PublicApi.athleteProfile || contract === PublicApi.sportPage) expect(res.status).toBe(404);
      else expect(res.status, contract.path).toBe(200);
    }
    expect((await t.call(ParticipationApi.session, {}, 'reader')).json).toMatchObject({
      kind: 'anon',
      user: null,
      pendingConsent: null,
      simulated: true,
      googleEnabled: false,
    });
  });
});
