// Publication of ranking snapshots (handoff §11.3, D12): a calculated snapshot is published automatically only when a
// re-run over the same data produces the same output hash AND the methodology golden still passes. Every decision is
// audited; a publication can be reverted (archive current + republish the previous one).
import { type Actor, active, rankingCalculationRuns, rankingSnapshots } from '@was/db';
import { METHODOLOGIES, type RankingInput, verifyGoldens } from '@was/ranking';
import { AdminAuditAction } from '@was/shared';
import { and, desc, eq, isNotNull } from 'drizzle-orm';

import { BaseService } from '../../core/base.service';
import type { AppDeps } from '../../http/app-deps.interface';
import { EVIDENCE } from './rankings.const';
import { competitorsOf } from './rankings-evidence.helper';

/** The system actor of an automatic publication. */
const SYSTEM_ACTOR: Actor = { userId: null, name: 'system:ranking', via: 'system:ranking' };

export class RankingPublicationService extends BaseService {
  /**
   * T2.3: publishes the calculated snapshot when the reproducibility gate passes. Returns the reason when it does not,
   * so the snapshot stays `calculated` for a human decision instead of being published silently.
   */
  static async autoPublish(deps: AppDeps, snapshotId: string): Promise<{ published: boolean; reason: string }> {
    const decision = await RankingPublicationService.tryPublish(deps, snapshotId);
    // The snapshot stays `calculated`; the reason is kept in the audit log for the admin decision.
    if (!decision.published)
      await deps.repo.audit(SYSTEM_ACTOR, AdminAuditAction.RankingAutoPublishSkipped, { type: 'ranking_snapshots', id: snapshotId }, {
        reason: `auto-publish skipped: ${decision.reason}`,
      });
    return decision;
  }

  private static async tryPublish(deps: AppDeps, snapshotId: string): Promise<{ published: boolean; reason: string }> {
    const db = deps.db;
    const [snap] = await db.select().from(rankingSnapshots).where(active(rankingSnapshots, eq(rankingSnapshots.id, snapshotId)));
    if (!snap) return { published: false, reason: 'snapshot not found' };
    if (snap.status !== 'calculated') return { published: false, reason: `snapshot is ${snap.status}` };
    const [run] = await db.select().from(rankingCalculationRuns).where(eq(rankingCalculationRuns.id, snap.runId));
    if (!run) return { published: false, reason: 'calculation run missing' };
    const methodologyKey = run.rankingKey.split(':')[0]!;
    const methodology = METHODOLOGIES[methodologyKey];
    const loadEvidence = EVIDENCE[methodologyKey];
    if (!methodology || !loadEvidence) return { published: false, reason: 'methodology not registered' };
    const golden = verifyGoldens(methodologyKey);
    if (!golden.ok) return { published: false, reason: `golden mismatch for ${golden.rankingKey || methodologyKey}` };
    const evidence = await loadEvidence(db);
    const input: RankingInput = { evidence, competitors: await competitorsOf(db, [...new Set(evidence.map((e) => e.competitorId))]) };
    const definitionKey = run.rankingKey.slice(methodologyKey.length + 1);
    const result = methodology.calculate(definitionKey, input);
    if (result.outputHash !== snap.outputHash) return { published: false, reason: 'output hash changed since the calculation (input or ruleset changed)' };
    await db.transaction(async (tx) => {
      await tx
        .update(rankingSnapshots)
        .set({ status: 'archived' })
        .where(and(eq(rankingSnapshots.rankingKey, snap.rankingKey), eq(rankingSnapshots.status, 'published')));
      await tx.update(rankingSnapshots).set({ status: 'published', publishedAt: new Date() }).where(eq(rankingSnapshots.id, snapshotId));
    });
    await deps.repo.audit(SYSTEM_ACTOR, AdminAuditAction.RankingAutoPublished, { type: 'ranking_snapshots', id: snapshotId }, {
      target: snap.title,
      reason: 'auto-publish: same output hash and methodology golden passed',
    });
    return { published: true, reason: 'published' };
  }

  /** Revert (D12): archive the current publication and republish the previous snapshot of the same ranking. */
  static async revert(deps: AppDeps, snapshotId: string, actor: Actor, reason: string): Promise<{ ok: boolean; reason: string }> {
    const db = deps.db;
    const [snap] = await db.select().from(rankingSnapshots).where(active(rankingSnapshots, eq(rankingSnapshots.id, snapshotId)));
    if (!snap) return { ok: false, reason: 'snapshot not found' };
    if (snap.status !== 'published') return { ok: false, reason: 'only a published snapshot can be reverted' };
    const [previous] = await db
      .select()
      .from(rankingSnapshots)
      .where(
        and(active(rankingSnapshots), eq(rankingSnapshots.rankingKey, snap.rankingKey), eq(rankingSnapshots.status, 'archived'), isNotNull(rankingSnapshots.publishedAt)),
      )
      .orderBy(desc(rankingSnapshots.publishedAt))
      .limit(1);
    // Only a snapshot that was published before can be restored (never an archived candidate that was never published).
    if (!previous) return { ok: false, reason: 'there is no previous snapshot to restore' };
    await db.transaction(async (tx) => {
      await tx.update(rankingSnapshots).set({ status: 'archived' }).where(eq(rankingSnapshots.id, snapshotId));
      await tx.update(rankingSnapshots).set({ status: 'published', publishedAt: new Date() }).where(eq(rankingSnapshots.id, previous.id));
    });
    await deps.repo.audit(actor, AdminAuditAction.RankingReverted, { type: 'ranking_snapshots', id: snapshotId }, { target: snap.title, reason });
    return { ok: true, reason: `restored ${previous.id}` };
  }

  /** Same decision as the static entry, bound to the request context. */
  autoPublish(snapshotId: string) {
    return RankingPublicationService.autoPublish(this.ctx.deps, snapshotId);
  }

  revert(snapshotId: string, reason: string) {
    return RankingPublicationService.revert(this.ctx.deps, snapshotId, this.actor, reason);
  }
}
