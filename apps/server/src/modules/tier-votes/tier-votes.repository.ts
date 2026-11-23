import { BaseReadRepository, championTiers, tierVotes } from '@was/db';
import type { Tier } from '@was/shared';
import { and, eq } from 'drizzle-orm';

/** Read model of the community tier votes. */
export class TierVotesRepository extends BaseReadRepository {
  /** Tier of every vote cast for an athlete. */
  async votesOfAthlete(athleteId: string): Promise<{ userId: string; tier: Tier }[]> {
    return this.db
      .select({ userId: tierVotes.userId, tier: championTiers.slug })
      .from(tierVotes)
      .innerJoin(championTiers, eq(championTiers.id, tierVotes.championTierId))
      .where(this.active(tierVotes, eq(tierVotes.athleteId, athleteId)));
  }

  /** Every live vote (admin tier signals). */
  async allVotes(): Promise<{ athleteId: string; tier: Tier }[]> {
    return this.db
      .select({ athleteId: tierVotes.athleteId, tier: championTiers.slug })
      .from(tierVotes)
      .innerJoin(championTiers, eq(championTiers.id, tierVotes.championTierId))
      .where(this.active(tierVotes));
  }

  async findVote(userId: string, athleteId: string) {
    const rows = await this.db
      .select()
      .from(tierVotes)
      .where(this.active(tierVotes, and(eq(tierVotes.userId, userId), eq(tierVotes.athleteId, athleteId))));
    return rows.at(0) ?? null;
  }
}
