import { type Database, active, championTiers, tierVotes } from '@was/db';
import type { Tier } from '@was/shared';
import { and, eq } from 'drizzle-orm';

/** Tier of every vote cast for an athlete. */
export const votesOfAthlete = async (db: Database, athleteId: string): Promise<{ userId: string; tier: Tier }[]> =>
  db
    .select({ userId: tierVotes.userId, tier: championTiers.slug })
    .from(tierVotes)
    .innerJoin(championTiers, eq(championTiers.id, tierVotes.championTierId))
    .where(active(tierVotes, eq(tierVotes.athleteId, athleteId)));

/** Every live vote (admin tier signals). */
export const allVotes = async (db: Database): Promise<{ athleteId: string; tier: Tier }[]> =>
  db
    .select({ athleteId: tierVotes.athleteId, tier: championTiers.slug })
    .from(tierVotes)
    .innerJoin(championTiers, eq(championTiers.id, tierVotes.championTierId))
    .where(active(tierVotes));

export const findVote = async (db: Database, userId: string, athleteId: string) =>
  (await db.select().from(tierVotes).where(active(tierVotes, and(eq(tierVotes.userId, userId), eq(tierVotes.athleteId, athleteId))))).at(0) ?? null;
