// Exclusive star + unlimited hearts (T3.1, D02/D03): transfer race, idempotency, counters, access, deletion, cache isolation.
import { competitorHearts, competitorStars, createDatabase, type DatabaseHandle, entityVersions, findRepoRoot, seedDatabase } from '@was/db';
import { accountDeleteWord, InteractionsApi, ParticipationApi, PublicApi } from '@was/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../app';
import { loadConfig } from '../config/env.config';
import { CACHE_CONTROL } from '../consts/cache-control.const';
import { AccountService } from '../modules/account/account.service';
import { InteractionsService } from '../modules/interactions/interactions.service';
import type { WebRuntime } from '../web/web-runtime.interface';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';
import { createTestUser, readerContext } from './test-user.helper';

describe.skipIf(!HAS_PROTOTYPE)('star and hearts (T3.1)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  const service = async (label: string) => {
    const user = await createTestUser(t, label);
    return { user, svc: new InteractionsService(readerContext(t, user)) };
  };
  const liveStars = (userId: string) =>
    t.deps.db
      .select()
      .from(competitorStars)
      .where(and(eq(competitorStars.userId, userId), isNull(competitorStars.deletedAt)));
  const liveHearts = (userId: string) =>
    t.deps.db
      .select()
      .from(competitorHearts)
      .where(and(eq(competitorHearts.userId, userId), isNull(competitorHearts.deletedAt)));
  const profileCounts = async (slug: string) =>
    ((await t.call(PublicApi.athleteProfile, { params: { slug } })).json.interactions ?? { stars: 0, hearts: 0 }) as { stars: number; hearts: number };

  it('authorization: every personal endpoint needs an account (401 anonymous), readers get 200', async () => {
    expect((await t.call(InteractionsApi.myInteractions)).status).toBe(401);
    expect((await t.call(InteractionsApi.setStar, { params: { slug: 'pele' } })).status).toBe(401);
    expect((await t.call(InteractionsApi.clearStar, { params: { slug: 'pele' } })).status).toBe(401);
    expect((await t.call(InteractionsApi.toggleHeart, { params: { slug: 'pele' }, body: { hearted: true } })).status).toBe(401);
    const mine = await t.call(InteractionsApi.myInteractions, {}, 'reader');
    expect(mine.status).toBe(200);
    expect(InteractionsApi.myInteractions.response.safeParse(mine.json).success).toBe(true);
    expect((await t.call(InteractionsApi.setStar, { params: { slug: 'nobody' } }, 'reader')).status).toBe(404);
  });

  it('the star is exclusive: giving it to another competitor moves it (one transaction, versioned)', async () => {
    const { user, svc } = await service('transfer');
    const before = { pele: await profileCounts('pele'), phelps: await profileCounts('michael-phelps') };
    expect((await svc.setStar(user, 'pele')).starred).toBe(true);
    const moved = await svc.setStar(user, 'michael-phelps');
    expect(moved).toMatchObject({ starred: true, counts: { stars: before.phelps.stars + 1 } });
    expect(await liveStars(user.id)).toHaveLength(1);
    expect((await profileCounts('pele')).stars).toBe(before.pele.stars);
    const [star] = await liveStars(user.id);
    const history = await t.deps.db.select().from(entityVersions).where(eq(entityVersions.entityId, star!.id));
    expect(history.map((v) => v.summary).sort()).toEqual(['star given', 'star moved']);
  });

  it('transfer race: two parallel setStar of the same account leave exactly one live star', async () => {
    const { user, svc } = await service('race');
    const results = await Promise.allSettled([svc.setStar(user, 'pele'), svc.setStar(user, 'michael-phelps'), svc.setStar(user, 'pele')]);
    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    const stars = await liveStars(user.id);
    expect(stars).toHaveLength(1);
    const mine = await svc.myInteractions(user);
    expect(mine.star).not.toBeNull();
  });

  it('idempotent: the same star twice changes nothing; clearing elsewhere is a no-op', async () => {
    const { user, svc } = await service('idempotent');
    await svc.setStar(user, 'pele');
    const [first] = await liveStars(user.id);
    await svc.setStar(user, 'pele');
    const [second] = await liveStars(user.id);
    expect(second!.version).toBe(first!.version);
    expect((await svc.clearStar(user, 'michael-phelps')).starred).toBe(false);
    expect(await liveStars(user.id)).toHaveLength(1);
    expect((await svc.clearStar(user, 'pele')).starred).toBe(false);
    expect(await liveStars(user.id)).toHaveLength(0);
    expect((await svc.clearStar(user, 'pele')).starred).toBe(false);
  });

  it('duplicate heart: the same heart twice (even in parallel) is stored once; un-heart twice is a no-op', async () => {
    const { user, svc } = await service('hearts');
    await Promise.all([svc.setHeart(user, 'pele', true), svc.setHeart(user, 'pele', true)]);
    await svc.setHeart(user, 'pele', true);
    expect(await liveHearts(user.id)).toHaveLength(1);
    // Hearts are unlimited across competitors.
    await svc.setHeart(user, 'michael-phelps', true);
    expect(await liveHearts(user.id)).toHaveLength(2);
    expect((await svc.setHeart(user, 'pele', false)).hearted).toBe(false);
    expect((await svc.setHeart(user, 'pele', false)).hearted).toBe(false);
    expect(await liveHearts(user.id)).toHaveLength(1);
  });

  it('counters: the view, the mutation response and the profile DTO agree', async () => {
    const before = await profileCounts('pele');
    const fans = await Promise.all(['fan-a', 'fan-b', 'fan-c'].map(service));
    for (const { user, svc } of fans) await svc.setHeart(user, 'pele', true);
    const last = await fans[0]!.svc.setStar(fans[0]!.user, 'pele');
    expect(last.counts).toEqual({ stars: before.stars + 1, hearts: before.hearts + 3 });
    expect(await profileCounts('pele')).toEqual(last.counts);
    // The public DTO carries counts only, never who starred.
    const profile = (await t.call(PublicApi.athleteProfile, { params: { slug: 'pele' } }, 'reader')).json;
    expect(Object.keys(profile.interactions)).toEqual(['stars', 'hearts']);
    expect(JSON.stringify(profile)).not.toContain(fans[0]!.user.id);
  });

  it('my list is private: each account only sees its own star and hearts; the export includes them', async () => {
    const a = await service('owner-a');
    const b = await service('owner-b');
    await a.svc.setStar(a.user, 'pele');
    await a.svc.setHeart(a.user, 'michael-phelps', true);
    expect((await b.svc.myInteractions(b.user)).star).toBeNull();
    const mine = await a.svc.myInteractions(a.user);
    expect(mine.star?.athlete.slug).toBe('pele');
    expect(mine.hearts.map((h) => h.athlete.slug)).toEqual(['michael-phelps']);
    const exported = await new AccountService(readerContext(t, a.user)).exportMyData(a.user);
    expect(exported.interactions).toEqual(mine);
    expect(ParticipationApi.exportMyData.response.safeParse(exported).success).toBe(true);
  });

  it('deletion: deleting the account removes its star and hearts and the public counts drop', async () => {
    const { user, svc } = await service('leaving');
    const before = await profileCounts('michael-phelps');
    await svc.setStar(user, 'michael-phelps');
    await svc.setHeart(user, 'michael-phelps', true);
    expect(await profileCounts('michael-phelps')).toEqual({ stars: before.stars + 1, hearts: before.hearts + 1 });
    await new AccountService(readerContext(t, user)).deleteAccount(user, accountDeleteWord('pt-BR'));
    expect(await liveStars(user.id)).toHaveLength(0);
    expect(await liveHearts(user.id)).toHaveLength(0);
    expect(await profileCounts('michael-phelps')).toEqual(before);
  });
});

describe.skipIf(!HAS_PROTOTYPE)('star and hearts: cache isolation (T3.1)', () => {
  let handle: DatabaseHandle;
  let created: ReturnType<typeof createApp>;
  const MINE = 'data-my-interactions';

  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
    await seedDatabase(handle.db, findRepoRoot());
    // A renderer that behaves like the real one: public profile in the HTML; the personal state only when the
    // request carries a session (the real page fetches it client-side, this one renders it to prove it never leaks).
    const web: WebRuntime = {
      dev: false,
      assets: async () => ({ scripts: [], css: [], preloads: [] }),
      loadRenderer: async () => ({
        async render({ request, nonce, apiFetch }) {
          const cookie = request.headers.get('cookie') ?? '';
          const profile = await (await apiFetch(new Request('http://ssr.internal/api/athletes/pele', { headers: { cookie } }))).text();
          const mine = await apiFetch(new Request('http://ssr.internal/api/me/interactions', { headers: { cookie } }));
          const personal = mine.status === 200 ? `<div ${MINE}>${await mine.text()}</div>` : '';
          return new Response(`<!DOCTYPE html><html><body><script nonce="${nonce}">${profile}</script>${personal}</body></html>`, {
            status: 200,
            headers: { 'content-type': 'text/html; charset=UTF-8' },
          });
        },
      }),
    };
    created = createApp({ db: handle.db, config: { ...loadConfig({}), logRequests: false }, web });
  });
  afterAll(() => handle.close());

  it('anonymous HTML has the counts but never anyone’s personal state, and personal pages are never cached', async () => {
    const app = created.app;
    const star = await app.request('/api/athletes/pele/star', { method: 'PUT', headers: { 'x-was-session': 'reader' } });
    expect(star.status).toBe(200);
    created.htmlCache.clear();

    const personal = await app.request('/athletes/pele', { headers: { cookie: 'was_session=reader' } });
    expect(personal.headers.get('cache-control')).toBe(CACHE_CONTROL.privateHtml);
    expect(await personal.text()).toContain(MINE);
    expect(created.htmlCache.size).toBe(0);

    const anonymous = await app.request('/athletes/pele');
    expect(anonymous.headers.get('cache-control')).toBe(CACHE_CONTROL.publicHtml);
    const html = await anonymous.text();
    expect(html).toContain('"interactions":{"stars":');
    expect(html).not.toContain(MINE);
    expect(html).not.toContain('"starred"');
    expect(html).not.toContain('"hearted"');
    // Served again from the in-process cache: still nothing personal.
    const again = await app.request('/athletes/pele');
    expect(again.headers.get('x-cache')).toBe('HIT');
    expect(await again.text()).not.toContain(MINE);
  });
});
