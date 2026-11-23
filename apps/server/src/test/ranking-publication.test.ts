// Auto-publish and revert (T2.3, D12): a calculated snapshot is only published when a re-run produces the same output
// hash and the methodology golden passes; a publication can be reverted to the previous snapshot of the same ranking.
import fs from 'node:fs';
import path from 'node:path';

import { auditLogs, findRepoRoot, rankingSnapshots } from '@was/db';
import { CanonicalWriter, createContext, runFootballChampions } from '@was/ingest';
import { AdminAuditAction } from '@was/shared';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { RankingPublicationService } from '../modules/rankings/ranking-publication.service';
import { calculateRankings } from '../modules/rankings/rankings.service';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';

const hasCache = fs.existsSync(path.join(findRepoRoot(), 'data/seeds/.cache/fjelstul/squads.csv'));
const admin = (id: string) => ({ userId: id, name: `admin ${id.slice(-1)}`, via: 'user' });

describe.skipIf(!HAS_PROTOTYPE || !hasCache)('ranking publication: auto-publish and revert (T2.3)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
    const ctx = createContext(t.deps.db, { offline: true });
    await runFootballChampions(ctx, { only: ['fifa-world-cup:2002'], olympics: false });
    await new CanonicalWriter(t.deps.db, t.deps.repo).writeProviders(['football-champions']);
  }, 180_000);
  afterAll(() => t.close());

  it('with RANKING_AUTO_PUBLISH=false the snapshots stay calculated', async () => {
    const ids = await calculateRankings(t.deps, 'football-champions', admin('00000000-0000-7000-8000-00000000000a'));
    const rows = await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, ids[0]!));
    expect(rows[0]?.status).toBe('calculated');
  });

  it('an output hash mismatch is never published: the snapshot stays calculated with the reason audited', async () => {
    const ids = await calculateRankings(t.deps, 'football-champions', admin('00000000-0000-7000-8000-00000000000a'));
    const id = ids[0]!;
    await t.deps.db.update(rankingSnapshots).set({ outputHash: 'tampered' }).where(eq(rankingSnapshots.id, id));
    const decision = await RankingPublicationService.autoPublish(t.deps, id);
    expect(decision).toMatchObject({ published: false, reason: expect.stringContaining('output hash changed') });
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, id)))[0]?.status).toBe('calculated');
    const audits = await t.deps.db.select().from(auditLogs).where(and(eq(auditLogs.entityId, id), eq(auditLogs.action, AdminAuditAction.RankingAutoPublishSkipped)));
    expect(audits.some((a) => String((a.metadata as { reason?: string }).reason).startsWith('auto-publish skipped'))).toBe(true);
  });

  it('with RANKING_AUTO_PUBLISH=true a reproducible snapshot is published and the previous one archived', async () => {
    t.deps.config.rankingAutoPublish = true;
    const first = await calculateRankings(t.deps, 'football-champions', admin('00000000-0000-7000-8000-00000000000a'));
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, first[0]!)))[0]?.status).toBe('published');
    const second = await calculateRankings(t.deps, 'football-champions', admin('00000000-0000-7000-8000-00000000000a'));
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, second[0]!)))[0]?.status).toBe('published');
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, first[0]!)))[0]?.status).toBe('archived');
  });

  it('revert archives the current publication and republishes the previous snapshot', async () => {
    const published = (await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.status, 'published'))).filter(
      (s) => s.rankingKey === 'football-champions:world-cup-men',
    );
    const current = published[0]!;
    const result = await RankingPublicationService.revert(t.deps, current.id, admin('00000000-0000-7000-8000-00000000000b'), 'wrong squad source');
    expect(result.ok).toBe(true);
    expect((await t.deps.db.select().from(rankingSnapshots).where(eq(rankingSnapshots.id, current.id)))[0]?.status).toBe('archived');
    const restored = (await t.deps.db.select().from(rankingSnapshots)).filter((s) => s.rankingKey === current.rankingKey && s.status === 'published');
    expect(restored).toHaveLength(1);
    expect(restored[0]!.id).not.toBe(current.id);
  });
});
