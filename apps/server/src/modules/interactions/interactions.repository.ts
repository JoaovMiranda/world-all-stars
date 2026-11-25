import { BaseReadRepository, competitorHearts, competitorInteractionCounts, competitorStars, users } from '@was/db';
import type { InteractionCounts } from '@was/shared';
import { and, asc, eq } from 'drizzle-orm';

/** Read model of stars and hearts (D02/D03): the public counters view and the owner's private rows. */
export class InteractionsRepository extends BaseReadRepository {
  /**
   * Serializes the star/heart writes of ONE account (SELECT … FOR UPDATE on its users row): two parallel requests of
   * the same account cannot both see "no star yet" and insert twice. Call it inside a transaction.
   */
  async lockAccount(userId: string): Promise<void> {
    await this.db.select({ id: users.id }).from(users).where(eq(users.id, userId)).for('update');
  }

  /** The account's live star; `lock` takes SELECT … FOR UPDATE on it for the rest of the transaction. */
  async starOf(userId: string, lock = false) {
    const query = this.db
      .select()
      .from(competitorStars)
      .where(this.active(competitorStars, eq(competitorStars.userId, userId)));
    const rows = lock ? await query.for('update') : await query;
    return rows.at(0) ?? null;
  }

  async heartOf(userId: string, competitorId: string) {
    const rows = await this.db
      .select()
      .from(competitorHearts)
      .where(this.active(competitorHearts, and(eq(competitorHearts.userId, userId), eq(competitorHearts.competitorId, competitorId))));
    return rows.at(0) ?? null;
  }

  /** Every live heart of the account, oldest first. */
  heartsOf(userId: string) {
    return this.db
      .select()
      .from(competitorHearts)
      .where(this.active(competitorHearts, eq(competitorHearts.userId, userId)))
      .orderBy(asc(competitorHearts.createdAt));
  }

  /** Public counts of a competitor (zeros when nobody starred or hearted it). */
  async countsOf(competitorId: string): Promise<InteractionCounts> {
    const [row] = await this.db.select().from(competitorInteractionCounts).where(eq(competitorInteractionCounts.competitorId, competitorId));
    return { stars: row?.starsCount ?? 0, hearts: row?.heartsCount ?? 0 };
  }
}
