import { aiCollectionRuns, BaseReadRepository } from '@was/db';
import type { CollectionRun } from '@was/shared';
import { asc } from 'drizzle-orm';

/** Read model of the public collection log. */
export class DiscoveryRepository extends BaseReadRepository {
  /** AI-assisted collection runs, oldest first (as executed). */
  async listCollectionRuns(): Promise<CollectionRun[]> {
    const rows = await this.db.select().from(aiCollectionRuns).where(this.active(aiCollectionRuns)).orderBy(asc(aiCollectionRuns.startedAt));
    return rows.map((r) => ({
      startedAt: r.startedAt.toISOString(),
      mode: r.mode,
      checked: r.checked,
      unchanged: r.unchanged,
      validated: r.validated,
      factsAccepted: r.factsAccepted,
      factsRejected: r.factsRejected,
      extractorTokens: r.extractorTokens,
    }));
  }
}
