import { type BaseRepository, competitorHearts, competitorStars } from '@was/db';
import type { InteractionCounts, InteractionStateResponse, MyInteractionItem, MyInteractionsResponse } from '@was/shared';

import type { AuthUser } from '../../auth/auth-provider.type';
import { BaseService } from '../../core/base.service';
import { notFound } from '../../http/http-error.helper';
import { InteractionsRepository } from './interactions.repository';

/**
 * Exclusive star + unlimited hearts (D02/D03). Every write runs in one transaction that first locks the account
 * (SELECT … FOR UPDATE) and goes through the BaseRepository (versioning + audit). All mutations are idempotent: they
 * describe the desired state, so a retry or a double click changes nothing.
 */
export class InteractionsService extends BaseService {
  private async competitorIdOf(slug: string): Promise<string> {
    const athlete = (await this.ctx.deps.catalog.get(this.ctx.locale)).athleteBySlug(slug);
    if (!athlete) throw notFound();
    return athlete.id;
  }

  /** Public counts of a competitor, or undefined when both are zero (the profile field is optional and additive). */
  async publicCountsOf(competitorId: string): Promise<InteractionCounts | undefined> {
    const counts = await new InteractionsRepository(this.db).countsOf(competitorId);
    return counts.stars || counts.hearts ? counts : undefined;
  }

  private async stateOf(read: InteractionsRepository, userId: string, competitorId: string): Promise<InteractionStateResponse> {
    const [star, heart, counts] = await Promise.all([read.starOf(userId), read.heartOf(userId, competitorId), read.countsOf(competitorId)]);
    return { starred: star?.competitorId === competitorId, hearted: !!heart, counts };
  }

  /** PUT star: gives the account's only star to this competitor, moving it from the previous one (transfer). */
  async setStar(user: AuthUser, slug: string): Promise<InteractionStateResponse> {
    const competitorId = await this.competitorIdOf(slug);
    return this.transaction(async (repo) => {
      const read = new InteractionsRepository(repo.db);
      await read.lockAccount(user.id);
      const current = await read.starOf(user.id, true);
      if (!current) await repo.insert(competitorStars, { userId: user.id, competitorId }, this.actor, { summary: 'star given' });
      else if (current.competitorId !== competitorId) await repo.update(competitorStars, current.id, { competitorId }, this.actor, { summary: 'star moved' });
      return this.stateOf(read, user.id, competitorId);
    });
  }

  /** DELETE star: takes the star back when it is on this competitor; a no-op when it is elsewhere or absent. */
  async clearStar(user: AuthUser, slug: string): Promise<InteractionStateResponse> {
    const competitorId = await this.competitorIdOf(slug);
    return this.transaction(async (repo) => {
      const read = new InteractionsRepository(repo.db);
      await read.lockAccount(user.id);
      const current = await read.starOf(user.id, true);
      if (current?.competitorId === competitorId) await repo.softDelete(competitorStars, current.id, this.actor, { summary: 'star removed' });
      return this.stateOf(read, user.id, competitorId);
    });
  }

  /** PUT heart: the desired state (hearted or not); one heart per account per competitor. */
  async setHeart(user: AuthUser, slug: string, hearted: boolean): Promise<InteractionStateResponse> {
    const competitorId = await this.competitorIdOf(slug);
    return this.transaction(async (repo) => {
      const read = new InteractionsRepository(repo.db);
      await read.lockAccount(user.id);
      const existing = await read.heartOf(user.id, competitorId);
      if (hearted && !existing) await repo.insert(competitorHearts, { userId: user.id, competitorId }, this.actor, { summary: 'heart given' });
      else if (!hearted && existing) await repo.softDelete(competitorHearts, existing.id, this.actor, { summary: 'heart removed' });
      return this.stateOf(read, user.id, competitorId);
    });
  }

  /** GET my star and hearts (private to the owner). Competitors no longer in the catalog are left out. */
  async myInteractions(user: AuthUser): Promise<MyInteractionsResponse> {
    const read = new InteractionsRepository(this.db);
    const [view, star, hearts] = await Promise.all([this.ctx.deps.catalog.get(this.ctx.locale), read.starOf(user.id), read.heartsOf(user.id)]);
    const listed = new Set(view.rows.athletes.map((a) => a.id));
    const item = (row: { competitorId: string; updatedAt: Date }): MyInteractionItem[] =>
      listed.has(row.competitorId) ? [{ athlete: view.athleteRef(row.competitorId), at: row.updatedAt.toISOString() }] : [];
    return { star: star ? (item(star)[0] ?? null) : null, hearts: hearts.flatMap(item) };
  }

  /** Account deletion (LGPD): soft-deletes every live star and heart of the account inside the caller's transaction. */
  async removeAllOf(repo: BaseRepository, userId: string): Promise<void> {
    const read = new InteractionsRepository(repo.db);
    const [star, hearts] = await Promise.all([read.starOf(userId, true), read.heartsOf(userId)]);
    if (star) await repo.softDelete(competitorStars, star.id, this.actor, { summary: 'account deleted' });
    for (const heart of hearts) await repo.softDelete(competitorHearts, heart.id, this.actor, { summary: 'account deleted' });
  }
}
