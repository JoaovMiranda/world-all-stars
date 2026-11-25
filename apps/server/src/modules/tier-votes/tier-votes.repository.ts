import { BaseReadRepository, championTiers, tierVoteFlags, tierVotes, users } from '@was/db';
import { type Tier, TierVoteFlagStatus } from '@was/shared';
import { and, count, desc, eq, gte, inArray } from 'drizzle-orm';

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

  /** Every live vote (admin tier signals), with its voter so flagged accounts can be left out. */
  async allVotes(): Promise<{ athleteId: string; userId: string; tier: Tier }[]> {
    return this.db
      .select({ athleteId: tierVotes.athleteId, userId: tierVotes.userId, tier: championTiers.slug })
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

  /** When the account was created (account-age rule). */
  async accountCreatedAt(userId: string): Promise<Date | null> {
    const [row] = await this.db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, userId));
    return row?.createdAt ?? null;
  }

  /** Accounts created after `youngSince` that cast or changed a live vote on the athlete after `since` (anomaly rule). */
  async youngVotersSince(athleteId: string, since: Date, youngSince: Date): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: tierVotes.userId })
      .from(tierVotes)
      .innerJoin(users, eq(users.id, tierVotes.userId))
      .where(this.active(tierVotes, eq(tierVotes.athleteId, athleteId), gte(tierVotes.updatedAt, since), gte(users.createdAt, youngSince)));
    return rows.map((r) => r.userId);
  }

  /** Accounts that already have a live flag (any status): a flag is raised once per account. */
  async flaggedAccounts(userIds: string[]): Promise<Set<string>> {
    if (!userIds.length) return new Set();
    const rows = await this.db
      .select({ userId: tierVoteFlags.userId })
      .from(tierVoteFlags)
      .where(this.active(tierVoteFlags, inArray(tierVoteFlags.userId, userIds)));
    return new Set(rows.map((r) => r.userId));
  }

  /** Accounts whose votes stay out of the signal: flagged and not cleared (pending or rejected). */
  async excludedAccounts(): Promise<Set<string>> {
    const rows = await this.db
      .select({ userId: tierVoteFlags.userId })
      .from(tierVoteFlags)
      .where(this.active(tierVoteFlags, inArray(tierVoteFlags.status, [TierVoteFlagStatus.Pending, TierVoteFlagStatus.Rejected])));
    return new Set(rows.map((r) => r.userId));
  }

  /** Every live flag with its account (name, creation) for the admin review, newest first. */
  flags() {
    return this.db
      .select({ flag: tierVoteFlags, account: users.displayName, accountCreatedAt: users.createdAt })
      .from(tierVoteFlags)
      .innerJoin(users, eq(users.id, tierVoteFlags.userId))
      .where(this.active(tierVoteFlags))
      .orderBy(desc(tierVoteFlags.createdAt));
  }

  /** Live tier votes per account (evidence shown next to each flag). */
  async votesPerAccount(userIds: string[]): Promise<Map<string, number>> {
    if (!userIds.length) return new Map();
    const rows = await this.db
      .select({ userId: tierVotes.userId, n: count() })
      .from(tierVotes)
      .where(this.active(tierVotes, inArray(tierVotes.userId, userIds)))
      .groupBy(tierVotes.userId);
    return new Map(rows.map((r) => [r.userId, r.n]));
  }

  async findFlag(id: string) {
    const rows = await this.db
      .select()
      .from(tierVoteFlags)
      .where(this.active(tierVoteFlags, eq(tierVoteFlags.id, id)));
    return rows.at(0) ?? null;
  }
}
