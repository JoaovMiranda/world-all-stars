// Ranking engine end-to-end (handoff v3 Fase 9): real ingestion (offline pilot) → calculation → two approvals by
// DIFFERENT admins → public snapshot; published snapshots are immutable; recalculation creates a new candidate.
import fs from 'node:fs';
import path from 'node:path';

import { findRepoRoot, rankingEntries, rankingSnapshots } from '@was/db';
import { CanonicalWriter, createContext, runBjjChampions, runFootballChampions } from '@was/ingest';
import { buildApiPath, RankingsApi } from '@was/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { approveSnapshot, calculateRankings } from '../modules/rankings/rankings.service';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';

const hasCache = fs.existsSync(path.join(findRepoRoot(), 'data/seeds/.cache/fjelstul/squads.csv'));
const admin = (id: string) => ({ userId: id, name: `admin ${id.slice(-1)}`, via: 'user' });

describe.skipIf(!HAS_PROTOTYPE || !hasCache)('rankings: calculate → approve twice → publish (E01–E05)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
    const ctx = createContext(t.deps.db, { offline: true });
    await runFootballChampions(ctx, { only: ['fifa-world-cup:2002', 'fifa-world-cup:1994'], olympics: false });
    await runBjjChampions(ctx, { only: ['adcc:2019'] });
    await new CanonicalWriter(t.deps.db, t.deps.repo).writeProviders(['football-champions', 'bjj-champions']);
  }, 180_000);
  afterAll(() => t.close());

  it('calculates candidates that are NOT public until two different admins approve', async () => {
    const ids = await calculateRankings(t.deps, 'football-champions', admin('00000000-0000-7000-8000-00000000000a'));
    expect(ids).toHaveLength(5);
    const [a] = await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, ids[0]!));
    expect(a?.status).toBe('calculated');
    expect(((await (await t.app.request(RankingsApi.list.path)).json()) as { items: unknown[] }).items).toHaveLength(0);
    // Ranking A: Cafu (1994 + 2002) = 2 credits, first; Ronaldo too (1994 squad + 2002).
    const top = await t.deps.db.select().from(rankingEntries).where(eq(rankingEntries.snapshotId, ids[0]!));
    expect(top.filter((e) => e.rank === 1).every((e) => e.score === 2)).toBe(true);

    const first = admin('00000000-0000-7000-8000-00000000000a');
    await approveSnapshot(t.deps, ids[0]!, first, 'checked against Fjelstul');
    await approveSnapshot(t.deps, ids[0]!, first, 'same admin again');
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, ids[0]!)))[0]?.status).toBe('calculated');
    await approveSnapshot(t.deps, ids[0]!, admin('00000000-0000-7000-8000-00000000000b'), 'second reviewer');
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, ids[0]!)))[0]?.status).toBe('published');

    const list = (await (await t.app.request(RankingsApi.list.path)).json()) as { items: { id: string }[] };
    expect(list.items.map((i) => i.id)).toEqual([ids[0]]);
    const detail = (await (await t.app.request(buildApiPath(RankingsApi.detail.path, { id: ids[0]! }))).json()) as {
      entries: { rank: number; competitor: { hasProfile: boolean } }[];
      total: number;
    };
    expect(detail.total).toBeGreaterThan(20);
    expect(RankingsApi.detail.response.safeParse(detail).success).toBe(true);
  });

  it('a published snapshot is immutable (trigger) and a recalculation creates a new candidate', async () => {
    const [published] = await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.status, 'published'));
    await expect(t.deps.db.update(rankingSnapshots).set({ outputHash: 'tampered' }).where(eq(rankingSnapshots.id, published!.id))).rejects.toThrow();
    await expect(t.deps.db.update(rankingEntries).set({ score: 99 }).where(eq(rankingEntries.snapshotId, published!.id))).rejects.toThrow();
    const again = await calculateRankings(t.deps, 'football-champions', admin('00000000-0000-7000-8000-00000000000a'));
    const [candidate] = await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, again[0]!));
    expect(candidate).toMatchObject({ status: 'calculated', outputHash: published!.outputHash });
  });

  it('BJJ: Wikipedia results stay provisional, so the candidate has no eligible entry until the sample is approved', async () => {
    const ids = await calculateRankings(t.deps, 'bjj-career', admin('00000000-0000-7000-8000-00000000000a'));
    const entries = await t.deps.db.select().from(rankingEntries).where(eq(rankingEntries.snapshotId, ids[2]!));
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((e) => !e.eligible)).toBe(true);
  });
});
