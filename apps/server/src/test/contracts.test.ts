// Contract conformance: every GET answers 200 with a body that the shared response schema accepts.
import { AdminApi, type ApiContract, ParticipationApi, PublicApi } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ALL_ROUTES } from '../routes';
import { HAS_PROTOTYPE, createTestApp, type TestApp } from './test-app.helper';

const ALL_CONTRACTS: ApiContract[] = [...Object.values(PublicApi), ...Object.values(ParticipationApi), ...Object.values(AdminApi)];

/** Input of each GET for the seeded database. */
const GET_INPUTS: Record<string, { params?: Record<string, string>; query?: Record<string, string> }> = {
  [PublicApi.home.path]: { query: { date: '2026-10-23' } },
  [PublicApi.athletes.path]: { query: { q: 'pel' } },
  [PublicApi.athleteProfile.path]: { params: { slug: 'pele' } },
  [PublicApi.compare.path]: { query: { slugs: 'pele,michael-phelps' } },
  [PublicApi.sportPage.path]: { params: { slug: 'futebol' } },
  [PublicApi.calendar.path]: { query: { from: '2026-01-01', to: '2026-12-31' } },
  [PublicApi.onThisDay.path]: { params: { md: '10-23' } },
  [ParticipationApi.tierVotes.path]: { params: { slug: 'pele' } },
  [ParticipationApi.comments.path]: { params: { slug: 'pele' } },
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

  for (const contract of ALL_CONTRACTS.filter((c) => c.method === 'GET')) {
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
    expect(home.json.sports.length).toBe(18);
    expect(home.json.globe.length).toBeGreaterThan(0);
  });

  it('404 for an unknown athlete or sport', async () => {
    expect((await t.call(PublicApi.athleteProfile, { params: { slug: 'nobody' } })).status).toBe(404);
    expect((await t.call(PublicApi.sportPage, { params: { slug: 'nothing' } })).json.error).toBe('not_found');
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
    expect((await t.call(ParticipationApi.session, {}, 'reader')).json).toMatchObject({ kind: 'anon', user: null, pendingConsent: null, simulated: true, googleEnabled: false });
  });
});
