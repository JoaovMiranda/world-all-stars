import { type Database, active, aiCollectionRuns } from '@was/db';
import type { CollectionRun } from '@was/shared';
import { asc } from 'drizzle-orm';

/** AI-assisted collection runs, oldest first (as executed). */
export const listCollectionRuns = async (db: Database): Promise<CollectionRun[]> =>
  (await db.select().from(aiCollectionRuns).where(active(aiCollectionRuns)).orderBy(asc(aiCollectionRuns.startedAt))).map((r) => ({
    startedAt: r.startedAt.toISOString(),
    mode: r.mode,
    checked: r.checked,
    unchanged: r.unchanged,
    validated: r.validated,
    factsAccepted: r.factsAccepted,
    factsRejected: r.factsRejected,
    extractorTokens: r.extractorTokens,
  }));
